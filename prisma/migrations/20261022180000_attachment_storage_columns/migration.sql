-- Renomeia colunas de Attachment para refletir o novo modelo de Storage.
-- O Prisma Migrate garante idempotência: cada migration roda exatamente uma vez
-- (registrada em _prisma_migrations).

ALTER TABLE "Attachment" RENAME COLUMN "storageKey" TO "storagePath";
ALTER TABLE "Attachment" RENAME COLUMN "sizeBytes" TO "fileSize";
