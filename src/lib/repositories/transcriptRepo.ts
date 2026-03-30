import { asc, desc, eq } from "drizzle-orm";

import { getDb, getSqliteClient } from "@/db/client";
import { transcriptTurns } from "@/db/schema";
import { createId } from "@/lib/ids";
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
    metadataJson?: Record<string, unknown> | null;
  }) {
    const db = getDb();
    const sqlite = getSqliteClient();
    const lastTurn = db
      .select()
      .from(transcriptTurns)
      .where(eq(transcriptTurns.interviewSessionId, input.interviewSessionId))
      .orderBy(desc(transcriptTurns.turnIndex))
      .get();
    const turnIndex = (lastTurn?.turnIndex ?? -1) + 1;
    const id = createId("turn");

    db.insert(transcriptTurns)
      .values({
        id,
        interviewSessionId: input.interviewSessionId,
        turnIndex,
        speaker: input.speaker,
        text: input.text,
        questionCategory: input.questionCategory ?? null,
        metadataJson: input.metadataJson ? JSON.stringify(input.metadataJson) : null,
        createdAt: Date.now(),
      })
      .run();

    sqlite
      .prepare(
        "INSERT INTO transcript_turns_fts (id, interview_session_id, speaker, text) VALUES (?, ?, ?, ?)",
      )
      .run(id, input.interviewSessionId, input.speaker, input.text);

    return { id, turnIndex };
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
      ? (sqlite.prepare(sqlText).all(query, sessionId) as Array<typeof transcriptTurns.$inferSelect>)
      : (sqlite.prepare(sqlText).all(query) as Array<typeof transcriptTurns.$inferSelect>);
  },
};
