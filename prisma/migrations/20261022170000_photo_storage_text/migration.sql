-- A chave de armazenamento pode conter uma data URL longa (fallback sem object storage).
-- O índice único em btree não suporta valores acima de ~8 KB.
DROP INDEX "Attachment_storageKey_key";
