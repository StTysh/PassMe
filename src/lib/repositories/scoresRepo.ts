import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { feedbackItems, scores } from "@/db/schema";
import { createId } from "@/lib/ids";

export const scoresRepo = {
  createScore(input: typeof scores.$inferInsert) {
    const db = getDb();
    db.insert(scores).values({ ...input, id: createId("score") }).run();
  },

  createFeedbackItems(
    items: Array<{
      interviewSessionId: string;
      category: string;
      title: string;
      body: string;
      severity?: string | null;
      sourceTurnIdsJson?: number[] | null;
    }>,
  ) {
    const db = getDb();
    for (const item of items) {
      db.insert(feedbackItems)
        .values({
          id: createId("feedback"),
          interviewSessionId: item.interviewSessionId,
          category: item.category,
          title: item.title,
          body: item.body,
          severity: item.severity ?? null,
          sourceTurnIdsJson: item.sourceTurnIdsJson
            ? JSON.stringify(item.sourceTurnIdsJson)
            : null,
          createdAt: Date.now(),
        })
        .run();
    }
  },

  deleteFeedbackItemsForSession(interviewSessionId: string) {
    const db = getDb();
    db.delete(feedbackItems).where(eq(feedbackItems.interviewSessionId, interviewSessionId)).run();
  },

  listFeedbackItems(interviewSessionId: string) {
    const db = getDb();
    return db
      .select()
      .from(feedbackItems)
      .where(eq(feedbackItems.interviewSessionId, interviewSessionId))
      .all()
      .map((row) => ({
        ...row,
        sourceTurnIdsJson: row.sourceTurnIdsJson ? JSON.parse(row.sourceTurnIdsJson) : null,
      }));
  },

  getScoreForSession(interviewSessionId: string) {
    const db = getDb();
    return db.select().from(scores).where(eq(scores.interviewSessionId, interviewSessionId)).get() ?? null;
  },
};
