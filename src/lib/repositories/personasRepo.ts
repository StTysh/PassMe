import { eq } from "drizzle-orm";

import { getDb, getSqliteClient } from "@/db/client";
import { interviewPersonas } from "@/db/schema";
import { createId } from "@/lib/ids";
import {
  DEFAULT_PERSONA_DEFINITIONS,
  personaToConfigJson,
} from "@/lib/personas/defaults";

function safeParseJson<T>(value: string, fallback: T, context: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`[personasRepo] Failed to parse ${context}`, error);
    return fallback;
  }
}

export const personasRepo = {
  seedDefaultPersonas() {
    const sqlite = getSqliteClient();
    const now = Date.now();

    const seed = sqlite.transaction(() => {
      for (const persona of DEFAULT_PERSONA_DEFINITIONS) {
        sqlite
          .prepare(
            `INSERT OR IGNORE INTO interview_personas (
              id, key, name, description, config_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            createId("persona"),
            persona.key,
            persona.name,
            persona.description,
            personaToConfigJson(persona.config),
            now,
            now,
          );
      }
    });

    seed();
  },

  getPersonaByKey(key: string) {
    const db = getDb();
    const row = db
      .select()
      .from(interviewPersonas)
      .where(eq(interviewPersonas.key, key))
      .get();

    return row
      ? { ...row, configJson: safeParseJson(row.configJson, null, "interview_personas.config_json") }
      : null;
  },

  listPersonas() {
    const db = getDb();
    return db
      .select()
      .from(interviewPersonas)
      .all()
      .flatMap((row) => {
        const configJson = safeParseJson(row.configJson, null, "interview_personas.config_json");
        return configJson ? [{ ...row, configJson }] : [];
      });
  },
};
