import { and, desc, eq } from "drizzle-orm";

import { getDb, getSqliteClient } from "@/db/client";
import { documents } from "@/db/schema";
import { createId } from "@/lib/ids";
import { sanitizeFtsQuery } from "@/lib/utils";
import type { DocumentType } from "@/lib/types/domain";

function mapDocument(row: typeof documents.$inferSelect) {
  return {
    ...row,
    parsedJson: row.parsedJson ? JSON.parse(row.parsedJson) : null,
  };
}

export const documentsRepo = {
  createDocument(input: {
    candidateProfileId: string;
    type: DocumentType;
    title?: string | null;
    sourceFilename?: string | null;
    mimeType?: string | null;
    rawText: string;
  }) {
    const db = getDb();
    const sqlite = getSqliteClient();
    const now = Date.now();
    const id = createId("doc");

    db.insert(documents)
      .values({
        id,
        candidateProfileId: input.candidateProfileId,
        type: input.type,
        title: input.title ?? null,
        sourceFilename: input.sourceFilename ?? null,
        mimeType: input.mimeType ?? null,
        rawText: input.rawText,
        parsedJson: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    sqlite
      .prepare(
        "INSERT INTO documents_fts (id, candidate_profile_id, type, title, raw_text) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, input.candidateProfileId, input.type, input.title ?? "", input.rawText);

    return this.getDocumentById(id);
  },

  updateParsedDocument(documentId: string, parsed: unknown) {
    const db = getDb();
    db.update(documents)
      .set({
        parsedJson: JSON.stringify(parsed),
        updatedAt: Date.now(),
      })
      .where(eq(documents.id, documentId))
      .run();

    return this.getDocumentById(documentId);
  },

  listDocumentsForProfile(profileId: string, type?: DocumentType) {
    const db = getDb();
    const condition = type
      ? and(eq(documents.candidateProfileId, profileId), eq(documents.type, type))
      : eq(documents.candidateProfileId, profileId);
    return db
      .select()
      .from(documents)
      .where(condition)
      .orderBy(desc(documents.createdAt))
      .all()
      .map(mapDocument);
  },

  getDocumentById(id: string) {
    const db = getDb();
    const row = db.select().from(documents).where(eq(documents.id, id)).get();
    return row ? mapDocument(row) : null;
  },

  replaceChunks(
    documentId: string,
    chunks: Array<{
      chunkIndex: number;
      text: string;
      tokenEstimate: number;
      metadataJson?: Record<string, unknown> | null;
    }>,
  ) {
    const sqlite = getSqliteClient();
    const replace = sqlite.transaction(() => {
      sqlite.prepare("DELETE FROM document_chunks WHERE document_id = ?").run(documentId);
      sqlite.prepare("DELETE FROM document_chunks_fts WHERE document_id = ?").run(documentId);

      for (const chunk of chunks) {
        const chunkId = createId("chunk");
        sqlite
          .prepare(
            `INSERT INTO document_chunks (
              id, document_id, chunk_index, text, token_estimate, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            chunkId,
            documentId,
            chunk.chunkIndex,
            chunk.text,
            chunk.tokenEstimate,
            chunk.metadataJson ? JSON.stringify(chunk.metadataJson) : null,
            Date.now(),
          );

        sqlite
          .prepare("INSERT INTO document_chunks_fts (id, document_id, text) VALUES (?, ?, ?)")
          .run(chunkId, documentId, chunk.text);
      }
    });

    replace();
  },

  searchChunks(query: string, profileId?: string) {
    const sqlite = getSqliteClient();
    const sanitizedQuery = sanitizeFtsQuery(query);
    if (!sanitizedQuery) {
      return [];
    }
    const sqlText = profileId
      ? `SELECT dc.id, dc.document_id as documentId, dc.text, d.type
         FROM document_chunks_fts fts
         JOIN document_chunks dc ON dc.id = fts.id
         JOIN documents d ON d.id = dc.document_id
         WHERE document_chunks_fts MATCH ? AND d.candidate_profile_id = ?
         LIMIT 10`
      : `SELECT dc.id, dc.document_id as documentId, dc.text, d.type
         FROM document_chunks_fts fts
         JOIN document_chunks dc ON dc.id = fts.id
         JOIN documents d ON d.id = dc.document_id
         WHERE document_chunks_fts MATCH ?
         LIMIT 10`;

    return profileId
      ? sqlite.prepare(sqlText).all(sanitizedQuery, profileId)
      : sqlite.prepare(sqlText).all(sanitizedQuery);
  },

  searchDocuments(query: string, profileId?: string) {
    const sqlite = getSqliteClient();
    const sanitizedQuery = sanitizeFtsQuery(query);
    if (!sanitizedQuery) {
      return [];
    }
    const sqlText = profileId
      ? `SELECT d.*
         FROM documents_fts fts
         JOIN documents d ON d.id = fts.id
         WHERE documents_fts MATCH ? AND d.candidate_profile_id = ?
         LIMIT 10`
      : `SELECT d.*
         FROM documents_fts fts
         JOIN documents d ON d.id = fts.id
         WHERE documents_fts MATCH ?
         LIMIT 10`;

    return profileId
      ? (sqlite.prepare(sqlText).all(sanitizedQuery, profileId) as Array<typeof documents.$inferSelect>)
      : (sqlite.prepare(sqlText).all(sanitizedQuery) as Array<typeof documents.$inferSelect>);
  },
};
