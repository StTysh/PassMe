import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { appSettings } from "@/db/schema";
import { createId } from "@/lib/ids";

export const settingsRepo = {
  getSetting(key: string) {
    const db = getDb();
    const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
    if (!row) {
      return null;
    }

    try {
      return JSON.parse(row.valueJson);
    } catch {
      return null;
    }
  },

  getSettingParsed<TSchema extends z.ZodTypeAny>(key: string, schema: TSchema) {
    const value = this.getSetting(key);
    if (value === null) {
      return null;
    }

    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : null;
  },

  upsertSetting(key: string, value: unknown) {
    const db = getDb();
    const now = Date.now();
    db.insert(appSettings)
      .values({
        id: createId("setting"),
        key,
        valueJson: JSON.stringify(value),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          valueJson: JSON.stringify(value),
          updatedAt: now,
        },
      })
      .run();
  },
};
