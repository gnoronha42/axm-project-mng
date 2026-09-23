CREATE TABLE IF NOT EXISTS "KnowledgeDocument" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "extractable" BOOLEAN NOT NULL DEFAULT TRUE,
  "summary" TEXT NOT NULL,
  "charCount" INTEGER NOT NULL DEFAULT 0,
  "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE,
  "ordinal" INTEGER NOT NULL,
  "heading" TEXT,
  "content" TEXT NOT NULL,
  UNIQUE ("documentId", "ordinal")
);
