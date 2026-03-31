import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { interviewSessions } from "@/db/schema";
import { createId } from "@/lib/ids";
import type { InterviewPlan } from "@/lib/types/domain";

function mapSession(row: typeof interviewSessions.$inferSelect) {
  return {
    ...row,
    planJson: row.planJson ? JSON.parse(row.planJson) : null,
    companyContextJson: row.companyContextJson ? JSON.parse(row.companyContextJson) : null,
    panelJson: row.panelJson ? JSON.parse(row.panelJson) : null,
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
        planJson: input.planJson ?? null,
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
    const db = getDb();
    const now = Date.now();
    db.update(interviewSessions)
      .set({ status: "active", startedAt: now, updatedAt: now })
      .where(eq(interviewSessions.id, sessionId))
      .run();
    return this.getSessionById(sessionId);
  },

  markSessionCompleted(sessionId: string) {
    const db = getDb();
    const now = Date.now();
    db.update(interviewSessions)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(eq(interviewSessions.id, sessionId))
      .run();
    return this.getSessionById(sessionId);
  },

  markSessionCancelled(sessionId: string) {
    const db = getDb();
    const now = Date.now();
    db.update(interviewSessions)
      .set({ status: "cancelled", completedAt: now, updatedAt: now })
      .where(eq(interviewSessions.id, sessionId))
      .run();
    return this.getSessionById(sessionId);
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
};
