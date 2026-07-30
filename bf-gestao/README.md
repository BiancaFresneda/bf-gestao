# BF Gestão

Sistema próprio de controle de tarefas, rotinas e obrigações de clientes da BF Serviços
Contábeis. Construído do zero (Next.js + PostgreSQL), para hospedagem em VPS própria.

Contexto completo e roteiro de fases em `docs/reference/` e no histórico do projeto.

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS 4
- PostgreSQL + Prisma 7 (driver adapter `@prisma/adapter-pg`)
- Sessão própria (cookie httpOnly assinado com `jose`), sem dependência de provedor externo
- Docker Compose + Caddy para deploy na VPS

## Desenvolvimento local

Pré-requisitos: Node.js 22+, Docker Desktop.

```bash
cp .env.example .env          # ajuste SESSION_SECRET (openssl rand -base64 32)
docker compose up -d postgres # só o banco — a app roda fora do Docker em dev
npm install
npm run db:migrate            # aplica as migrações
npm run db:seed               # cria departamentos + usuário admin inicial
npm run dev
```

O seed cria o usuário admin com o e-mail definido em `ADMIN_EMAIL` (padrão:
`bianca@bfservicoscontabeis.com.br`). Se `ADMIN_PASSWORD` não estiver definido no `.env`, uma
senha temporária é gerada e impressa no terminal — troque-a depois do primeiro login.

Outros comandos úteis: `npm run db:studio` (interface visual do banco), `npm run db:generate`
(regenerar o Prisma Client após mudar o schema).

## Deploy em produção (VPS Hostinger)

1. Configure o DNS do domínio apontando para o IP da VPS.
2. Copie `.env.example` para `.env` na VPS e preencha todos os valores (gere `SESSION_SECRET` e
   `INTERNAL_API_SECRET` com `openssl rand -base64 32`, defina uma senha forte de Postgres).
3. Edite `deploy/Caddyfile` com o domínio real.
4. Suba tudo:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env up -d --build
   docker compose -f docker-compose.prod.yml --env-file .env exec app npx prisma migrate deploy
   docker compose -f docker-compose.prod.yml --env-file .env exec app npx prisma db seed
   ```
5. O Caddy provisiona HTTPS automaticamente para o domínio configurado.

Deploys seguintes: `git pull && docker compose -f docker-compose.prod.yml up -d --build`.

## Estrutura de fases

O banco de dados (`prisma/schema.prisma`) já modela todos os módulos planejados, mas a
implementação é entregue por etapas:

- **Fase 0 (concluída)** — fundação: autenticação, papéis, departamentos/usuários, infraestrutura
  de deploy.
- **Fase 1** — cadastro de clientes.
- **Fase 2** — motor de tarefas recorrentes (idempotente, auditável) — a entrega principal.
- **Fase 3** — certidões e certificados.
- **Fase 4** — contratos.
- **Fase 5** — financeiro.
