import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { interviewPersonas } from "@/db/schema";
import { createId } from "@/lib/ids";
import {
  DEFAULT_PERSONA_DEFINITIONS,
  personaToConfigJson,
} from "@/lib/personas/defaults";

export const personasRepo = {
  seedDefaultPersonas() {
    const db = getDb();
    const now = Date.now();

    for (const persona of DEFAULT_PERSONA_DEFINITIONS) {
      const existing = db
        .select()
        .from(interviewPersonas)
        .where(eq(interviewPersonas.key, persona.key))
        .get();

      if (!existing) {
        db.insert(interviewPersonas)
          .values({
          id: createId("persona"),
          key: persona.key,
          name: persona.name,
          description: persona.description,
          configJson: personaToConfigJson(persona.config),
          createdAt: now,
          updatedAt: now,
        })
          .run();
      }
    }
  },

  getPersonaByKey(key: string) {
    const db = getDb();
    const row = db
      .select()
      .from(interviewPersonas)
      .where(eq(interviewPersonas.key, key))
      .get();

    return row ? { ...row, configJson: JSON.parse(row.configJson) } : null;
  },

  listPersonas() {
    const db = getDb();
    return db.select().from(interviewPersonas).all().map((row) => ({
      ...row,
      configJson: JSON.parse(row.configJson),
    }));
  },
};
