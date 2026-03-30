import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { appSettings } from "@/db/schema";
import { createId } from "@/lib/ids";

export const settingsRepo = {
  getSetting(key: string) {
    const db = getDb();
    const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
    return row ? JSON.parse(row.valueJson) : null;
  },

  upsertSetting(key: string, value: unknown) {
    const db = getDb();
    const existing = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
    if (existing) {
      db.update(appSettings)
        .set({ valueJson: JSON.stringify(value), updatedAt: Date.now() })
        .where(eq(appSettings.key, key))
        .run();
      return;
    }

    db.insert(appSettings)
      .values({
        id: createId("setting"),
        key,
        valueJson: JSON.stringify(value),
        updatedAt: Date.now(),
      })
      .run();
  },
};
