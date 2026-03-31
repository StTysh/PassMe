import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/client";
import { interviewSessions } from "@/db/schema";
import { createId } from "@/lib/ids";
import type { InterviewPlan } from "@/lib/types/domain";

function safeParseJson<T>(value: string | null, fallback: T, context: string): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`[interviewsRepo] Failed to parse ${context}`, error);
    return fallback;
  }
}

function mapSession(row: typeof interviewSessions.$inferSelect) {
  return {
    ...row,
    planJson: safeParseJson(row.planJson, null, "interview_sessions.plan_json"),
    companyContextJson: safeParseJson(
      row.companyContextJson,
      null,
      "interview_sessions.company_context_json",
    ),
    panelJson: safeParseJson(row.panelJson, null, "interview_sessions.panel_json"),
  };
}

export const interviewsRepo = {
  createSession(input: typeof interviewSessions.$inferInsert) {
    const db = getDb();
    const now = Date.now();
    const id = createId("session");
    db.insert(interviewSessions)
      .values({
        ...input,
        id,
        resumeDocumentId: input.resumeDocumentId ?? null,
        jobDocumentId: input.jobDocumentId ?? null,
        planJson: input.planJson ?? null,
        companyContextJson: input.companyContextJson ?? null,
        panelJson: input.panelJson ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return this.getSessionById(id);
  },

  getSessionById(id: string) {
    const db = getDb();
    const row = db.select().from(interviewSessions).where(eq(interviewSessions.id, id)).get();
    return row ? mapSession(row) : null;
  },

  updateSessionPlan(sessionId: string, plan: InterviewPlan) {
    const db = getDb();
    db.update(interviewSessions)
      .set({
        planJson: JSON.stringify(plan),
        updatedAt: Date.now(),
      })
      .where(eq(interviewSessions.id, sessionId))
      .run();
    return this.getSessionById(sessionId);
  },

  markSessionStarted(sessionId: string) {
    return this.markSessionStartedIfPlanned(sessionId);
  },

  markSessionCompleted(sessionId: string) {
    return this.markSessionCompletedIfActive(sessionId);
  },

  markSessionCancelled(sessionId: string) {
    return this.markSessionCancelledIfActiveOrPlanned(sessionId);
  },

  markSessionStartedIfPlanned(sessionId: string) {
    const db = getDb();
    const now = Date.now();
    const result = db.update(interviewSessions)
      .set({ status: "active", startedAt: now, updatedAt: now })
      .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.status, "planned")))
      .run();
    return result.changes > 0 ? this.getSessionById(sessionId) : null;
  },

  markSessionPlannedIfActive(sessionId: string) {
    const db = getDb();
    const now = Date.now();
    const result = db.update(interviewSessions)
      .set({ status: "planned", startedAt: null, updatedAt: now })
      .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.status, "active")))
      .run();
    return result.changes > 0 ? this.getSessionById(sessionId) : null;
  },

  markSessionCompletedIfActive(sessionId: string) {
    const db = getDb();
    const now = Date.now();
    const result = db.update(interviewSessions)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.status, "active")))
      .run();
    return result.changes > 0 ? this.getSessionById(sessionId) : null;
  },

  markSessionCancelledIfActiveOrPlanned(sessionId: string) {
    const db = getDb();
    const now = Date.now();
    const result = db.update(interviewSessions)
      .set({ status: "cancelled", completedAt: now, updatedAt: now })
      .where(
        and(
          eq(interviewSessions.id, sessionId),
          inArray(interviewSessions.status, ["planned", "active"]),
        ),
      )
      .run();
    return result.changes > 0 ? this.getSessionById(sessionId) : null;
  },

  listSessions() {
    const db = getDb();
    return db
      .select()
      .from(interviewSessions)
      .orderBy(desc(interviewSessions.createdAt))
      .all()
      .map(mapSession);
  },

  listSessionsForProfile(profileId: string) {
    const db = getDb();
    return db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.candidateProfileId, profileId))
      .orderBy(desc(interviewSessions.createdAt))
      .all()
      .map(mapSession);
  },

  listComparableSessions(profileId: string, interviewType: string) {
    const db = getDb();
    return db
      .select()
      .from(interviewSessions)
      .where(
        and(
          eq(interviewSessions.candidateProfileId, profileId),
          eq(interviewSessions.interviewType, interviewType),
        ),
      )
      .orderBy(desc(interviewSessions.createdAt))
      .all()
      .map(mapSession);
  },

  listSessionsByStatusesForProfile(
    profileId: string,
    statuses: Array<"planned" | "active" | "completed" | "cancelled">,
  ) {
    const db = getDb();
    return db
      .select()
      .from(interviewSessions)
      .where(
        and(
          eq(interviewSessions.candidateProfileId, profileId),
          inArray(interviewSessions.status, statuses),
        ),
      )
      .orderBy(desc(interviewSessions.createdAt))
      .all()
      .map(mapSession);
  },

  listSessionsByJobDocument(
    jobDocumentId: string,
    statuses?: Array<"planned" | "active" | "completed" | "cancelled">,
  ) {
    const db = getDb();
    const condition = statuses?.length
      ? and(
          eq(interviewSessions.jobDocumentId, jobDocumentId),
          inArray(interviewSessions.status, statuses),
        )
      : eq(interviewSessions.jobDocumentId, jobDocumentId);

    return db
      .select()
      .from(interviewSessions)
      .where(condition)
      .orderBy(desc(interviewSessions.createdAt))
      .all()
      .map(mapSession);
  },

  listSessionsByResumeDocument(
    resumeDocumentId: string,
    statuses?: Array<"planned" | "active" | "completed" | "cancelled">,
  ) {
    const db = getDb();
    const condition = statuses?.length
      ? and(
          eq(interviewSessions.resumeDocumentId, resumeDocumentId),
          inArray(interviewSessions.status, statuses),
        )
      : eq(interviewSessions.resumeDocumentId, resumeDocumentId);

    return db
      .select()
      .from(interviewSessions)
      .where(condition)
      .orderBy(desc(interviewSessions.createdAt))
      .all()
      .map(mapSession);
  },
};
