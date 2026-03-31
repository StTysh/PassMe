import { asc, eq } from "drizzle-orm";

import { getDb, getSqliteClient } from "@/db/client";
import { transcriptTurns } from "@/db/schema";
import { createId } from "@/lib/ids";
import { sanitizeFtsQuery } from "@/lib/utils";
import type { Speaker } from "@/lib/types/domain";

function mapTurn(row: typeof transcriptTurns.$inferSelect) {
  return {
    ...row,
    metadataJson: row.metadataJson ? JSON.parse(row.metadataJson) : null,
  };
}

export const transcriptRepo = {
  appendTurn(input: {
    interviewSessionId: string;
    speaker: Speaker;
    text: string;
    questionCategory?: string | null;
    interviewerKey?: string | null;
    metadataJson?: Record<string, unknown> | null;
  }) {
    const sqlite = getSqliteClient();
    const id = createId("turn");
    const now = Date.now();

    const append = sqlite.transaction(() => {
      const lastTurn = sqlite
        .prepare(
          `SELECT turn_index
           FROM transcript_turns
           WHERE interview_session_id = ?
           ORDER BY turn_index DESC
           LIMIT 1`,
        )
        .get(input.interviewSessionId) as { turn_index?: number } | undefined;
      const turnIndex = (lastTurn?.turn_index ?? -1) + 1;

      sqlite
        .prepare(
          `INSERT INTO transcript_turns (
            id, interview_session_id, turn_index, speaker, text,
            question_category, interviewer_key, metadata_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          input.interviewSessionId,
          turnIndex,
          input.speaker,
          input.text,
          input.questionCategory ?? null,
          input.interviewerKey ?? null,
          input.metadataJson ? JSON.stringify(input.metadataJson) : null,
          now,
        );

      sqlite
        .prepare(
          "INSERT INTO transcript_turns_fts (id, interview_session_id, speaker, text) VALUES (?, ?, ?, ?)",
        )
        .run(id, input.interviewSessionId, input.speaker, input.text);

      return { id, turnIndex };
    });

    return append();
  },

  listTurnsForSession(sessionId: string) {
    const db = getDb();
    return db
      .select()
      .from(transcriptTurns)
      .where(eq(transcriptTurns.interviewSessionId, sessionId))
      .orderBy(asc(transcriptTurns.turnIndex))
      .all()
      .map(mapTurn);
  },

  getLastTurns(sessionId: string, limit: number) {
    return this.listTurnsForSession(sessionId).slice(-limit);
  },

  searchTranscript(query: string, sessionId?: string) {
    const sqlite = getSqliteClient();
    const sanitizedQuery = sanitizeFtsQuery(query);
    if (!sanitizedQuery) {
      return [];
    }
    const sqlText = sessionId
      ? `SELECT t.* FROM transcript_turns_fts fts
         JOIN transcript_turns t ON t.id = fts.id
         WHERE transcript_turns_fts MATCH ? AND t.interview_session_id = ?
         LIMIT 10`
      : `SELECT t.* FROM transcript_turns_fts fts
         JOIN transcript_turns t ON t.id = fts.id
         WHERE transcript_turns_fts MATCH ?
         LIMIT 10`;

    return sessionId
      ? (sqlite.prepare(sqlText).all(sanitizedQuery, sessionId) as Array<typeof transcriptTurns.$inferSelect>)
      : (sqlite.prepare(sqlText).all(sanitizedQuery) as Array<typeof transcriptTurns.$inferSelect>);
  },
};
