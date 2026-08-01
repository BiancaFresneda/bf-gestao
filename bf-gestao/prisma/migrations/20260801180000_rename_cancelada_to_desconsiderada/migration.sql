-- Renomeia o valor do enum em vez de recriar o tipo: preserva quaisquer linhas
-- existentes com esse status (não há hoje, mas evita o DROP+CREATE que o Prisma
-- geraria automaticamente para uma "remoção" de valor).
ALTER TYPE "TaskStatus" RENAME VALUE 'CANCELADA' TO 'DESCONSIDERADA';
