ALTER TABLE "task_templates" ADD COLUMN "defaultResponsibleId" TEXT;

ALTER TABLE "task_templates"
  ADD CONSTRAINT "task_templates_defaultResponsibleId_fkey"
  FOREIGN KEY ("defaultResponsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
