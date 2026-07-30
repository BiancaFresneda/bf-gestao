import "server-only";
import { prisma } from "@/lib/prisma";
import { RuleSchema } from "@/app/(app)/configuracoes/tarefas/rule";
import { competenciaAt, nextCompetencia, type RecurringPeriodicity } from "./competencia";
import { computeDeadlines } from "./date-rules";
import { loadHolidaySet } from "./holidays";
import { nowInSaoPauloMidnight, shiftMonths } from "./dates";

// Teto de segurança por vínculo cliente+template numa única execução — nunca deveria
// ser atingido em uso normal (o cron roda várias vezes ao dia), só protege contra bug.
const MAX_ITEMS_PER_LINK = 36;

// Lock consultivo do Postgres — evita duas execuções concorrentes (dois cliques no botão,
// cron e botão ao mesmo tempo). É liberado automaticamente se a conexão cair.
const ADVISORY_LOCK_KEY = 911_001;

type GenerationResult = {
  runId: string | null;
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "SKIPPED_LOCK";
  created: number;
  skipped: number;
  errors: number;
};

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

export async function generateTasks(triggeredBy: "CRON" | "MANUAL"): Promise<GenerationResult> {
  const lockRows = await prisma.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_KEY}) as locked`;
  if (!lockRows[0]?.locked) {
    return { runId: null, status: "SKIPPED_LOCK", created: 0, skipped: 0, errors: 0 };
  }

  try {
    const run = await prisma.taskGenerationRun.create({ data: { triggeredBy, status: "RUNNING" } });

    let created = 0;
    let skipped = 0;
    let errorCount = 0;

    try {
      const referenceDate = nowInSaoPauloMidnight();
      const holidays = await loadHolidaySet();

      const links = await prisma.clientTaskTemplate.findMany({
        where: {
          active: true,
          client: { status: "ATIVO" },
          taskTemplate: { active: true, periodicity: { not: "PONTUAL" } },
        },
        include: { taskTemplate: true },
      });

      for (const link of links) {
        const parsedRule = RuleSchema.safeParse(link.taskTemplate.legalDeadlineRule);
        if (!parsedRule.success || parsedRule.data.type === "unset") {
          // Regra ainda não configurada — não é erro, apenas nada a gerar até a Bianca definir.
          continue;
        }

        const periodicity = link.taskTemplate.periodicity as RecurringPeriodicity;
        const lastTask = await prisma.task.findFirst({
          where: { clientId: link.clientId, taskTemplateId: link.taskTemplateId },
          orderBy: { competenciaInicio: "desc" },
          select: { competenciaInicio: true },
        });

        // Teto explícito por template: em que competência estamos "hoje", deslocada pelo
        // competenciaOffsetMonths configurado — ex.: DAS gerado em julho aponta pra
        // competência de junho (offset -1). Nunca um número de dias de antecedência
        // arbitrário — a regra é sempre a que a Bianca configurou no cadastro da tarefa.
        const ceiling = competenciaAt(periodicity, shiftMonths(referenceDate, link.taskTemplate.competenciaOffsetMonths));

        let competencia = lastTask
          ? nextCompetencia(periodicity, lastTask.competenciaInicio)
          : competenciaAt(periodicity, link.vigenciaInicio);

        // Vínculo novo, sem tarefa anterior: a vigência começa no dia em que o cliente foi
        // marcado na tela (hoje), mas a competência "hoje" pode já estar à frente do teto
        // (ex.: competenciaOffsetMonths=-1 faz o teto apontar pro mês passado). Nesse caso
        // a primeira competência a gerar é o próprio teto, nunca uma posterior a ele.
        if (!lastTask && competencia.inicio.getTime() > ceiling.inicio.getTime()) {
          competencia = ceiling;
        }

        let iterations = 0;
        while (
          competencia.inicio.getTime() <= ceiling.inicio.getTime() &&
          (!link.vigenciaFim || competencia.inicio.getTime() <= link.vigenciaFim.getTime()) &&
          iterations < MAX_ITEMS_PER_LINK
        ) {
          iterations++;

          try {
            const { prazoLegal, prazoMeta } = computeDeadlines({
              rule: parsedRule.data,
              competenciaInicio: competencia.inicio,
              businessDayAdjustment: link.taskTemplate.businessDayAdjustment,
              metaOffsetDays: link.taskTemplate.metaDeadlineOffsetDays,
              holidays,
            });

            await prisma.task.create({
              data: {
                clientId: link.clientId,
                taskTemplateId: link.taskTemplateId,
                title: link.taskTemplate.name,
                responsibleUserId: link.taskTemplate.defaultResponsibleId,
                competenciaKey: competencia.key,
                competenciaInicio: competencia.inicio,
                competenciaFim: competencia.fim,
                prazoLegal,
                prazoMeta,
              },
            });
            created++;
            await prisma.taskGenerationRunItem.create({
              data: {
                runId: run.id,
                clientId: link.clientId,
                taskTemplateId: link.taskTemplateId,
                competenciaKey: competencia.key,
                result: "CREATED",
              },
            });
          } catch (error) {
            if (isUniqueConstraintError(error)) {
              skipped++;
              await prisma.taskGenerationRunItem.create({
                data: {
                  runId: run.id,
                  clientId: link.clientId,
                  taskTemplateId: link.taskTemplateId,
                  competenciaKey: competencia.key,
                  result: "SKIPPED",
                },
              });
            } else {
              errorCount++;
              await prisma.taskGenerationRunItem.create({
                data: {
                  runId: run.id,
                  clientId: link.clientId,
                  taskTemplateId: link.taskTemplateId,
                  competenciaKey: competencia.key,
                  result: "ERROR",
                  errorMessage: error instanceof Error ? error.message : String(error),
                },
              });
            }
          }

          competencia = nextCompetencia(periodicity, competencia.inicio);
        }
      }

      const status = errorCount > 0 ? (created > 0 || skipped > 0 ? "PARTIAL" : "FAILED") : "SUCCESS";
      await prisma.taskGenerationRun.update({
        where: { id: run.id },
        data: { status, createdCount: created, skippedCount: skipped, errorCount, finishedAt: new Date() },
      });

      return { runId: run.id, status, created, skipped, errors: errorCount };
    } catch (error) {
      await prisma.taskGenerationRun.update({
        where: { id: run.id },
        data: { status: "FAILED", createdCount: created, skippedCount: skipped, errorCount: errorCount + 1, finishedAt: new Date() },
      });
      throw error;
    }
  } finally {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`;
  }
}
