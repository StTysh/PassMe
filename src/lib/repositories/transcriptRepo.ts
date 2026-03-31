import { asc, eq } from "drizzle-orm";

import { getDb, getSqliteClient } from "@/db/client";
import { transcriptTurns } from "@/db/schema";
import { createId } from "@/lib/ids";
import { sanitizeFtsQuery } from "@/lib/utils";
import type { Speaker } from "@/lib/types/domain";

function safeParseJson<T>(value: string | null, fallback: T, context: string): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`[transcriptRepo] Failed to parse ${context}`, error);
    return fallback;
  }
}

function mapTurn(row: typeof transcriptTurns.$inferSelect) {
  return {
    ...row,
    metadataJson: safeParseJson(row.metadataJson, null, "transcript_turns.metadata_json"),
  };
}

function insertTurnRows(
  sqlite: ReturnType<typeof getSqliteClient>,
  input: {
    interviewSessionId: string;
    speaker: Speaker;
    text: string;
    questionCategory?: string | null;
    interviewerKey?: string | null;
    metadataJson?: Record<string, unknown> | null;
  },
) {
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
  const id = createId("turn");
  const now = Date.now();

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
    .prepare("INSERT INTO transcript_turns_fts (id, interview_session_id, speaker, text) VALUES (?, ?, ?, ?)")
    .run(id, input.interviewSessionId, input.speaker, input.text);

  return { id, turnIndex };
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

    const append = sqlite.transaction(() => {
      return insertTurnRows(sqlite, input);
    });

    return append();
  },

  deleteTurn(turnId: string) {
    const sqlite = getSqliteClient();
    const remove = sqlite.transaction(() => {
      sqlite.prepare("DELETE FROM transcript_turns_fts WHERE id = ?").run(turnId);
      sqlite.prepare("DELETE FROM transcript_turns WHERE id = ?").run(turnId);
    });

    remove();
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

  searchTranscript(
    query: string,
    options?: {
      sessionId?: string;
      profileId?: string;
    },
  ) {
    const sqlite = getSqliteClient();
    const sanitizedQuery = sanitizeFtsQuery(query);
    if (!sanitizedQuery) {
      return [];
    }
    if (options?.profileId) {
      return sqlite
        .prepare(
          `SELECT t.*
           FROM transcript_turns_fts fts
           JOIN transcript_turns t ON t.id = fts.id
           JOIN interview_sessions s ON s.id = t.interview_session_id
           WHERE transcript_turns_fts MATCH ? AND s.candidate_profile_id = ?
           LIMIT 10`,
        )
        .all(sanitizedQuery, options.profileId) as Array<typeof transcriptTurns.$inferSelect>;
    }

    if (options?.sessionId) {
      return sqlite
        .prepare(
          `SELECT t.* FROM transcript_turns_fts fts
           JOIN transcript_turns t ON t.id = fts.id
           WHERE transcript_turns_fts MATCH ? AND t.interview_session_id = ?
           LIMIT 10`,
        )
        .all(sanitizedQuery, options.sessionId) as Array<typeof transcriptTurns.$inferSelect>;
    }

    return sqlite
      .prepare(
        `SELECT t.* FROM transcript_turns_fts fts
         JOIN transcript_turns t ON t.id = fts.id
         WHERE transcript_turns_fts MATCH ?
         LIMIT 10`,
      )
      .all(sanitizedQuery) as Array<typeof transcriptTurns.$inferSelect>;
  },
};
