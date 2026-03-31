import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { candidateProfiles } from "@/db/schema";
import { createId } from "@/lib/ids";

function safeParseJson<T>(value: string, fallback: T, context: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`[profilesRepo] Failed to parse ${context}`, error);
    return fallback;
  }
}

function mapProfile(row: typeof candidateProfiles.$inferSelect) {
  return {
    id: row.id,
    fullName: row.fullName,
    headline: row.headline,
    email: row.email,
    yearsExperience: row.yearsExperience,
    targetRoles: safeParseJson<string[]>(
      row.targetRolesJson,
      [],
      "candidate_profiles.target_roles_json",
    ),
    primaryDomain: row.primaryDomain,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const profilesRepo = {
  createProfile(input: {
    fullName: string;
    headline: string | null;
    email: string | null;
    yearsExperience: number | null;
    targetRoles: string[];
    primaryDomain: string | null;
    notes: string | null;
  }) {
    const db = getDb();
    const now = Date.now();
    const id = createId("profile");

    db.insert(candidateProfiles)
      .values({
        id,
        fullName: input.fullName,
        headline: input.headline,
        email: input.email,
        yearsExperience: input.yearsExperience,
        targetRolesJson: JSON.stringify(input.targetRoles),
        primaryDomain: input.primaryDomain,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return this.getProfileById(id);
  },

  getProfileById(id: string) {
    const db = getDb();
    const row = db.select().from(candidateProfiles).where(eq(candidateProfiles.id, id)).get();
    return row ? mapProfile(row) : null;
  },

  updateProfile(
    id: string,
    input: {
      fullName: string;
      headline: string | null;
      email: string | null;
      yearsExperience: number | null;
      targetRoles: string[];
      primaryDomain: string | null;
      notes: string | null;
    },
  ) {
    const db = getDb();
    db.update(candidateProfiles)
      .set({
        fullName: input.fullName,
        headline: input.headline,
        email: input.email,
        yearsExperience: input.yearsExperience,
        targetRolesJson: JSON.stringify(input.targetRoles),
        primaryDomain: input.primaryDomain,
        notes: input.notes,
        updatedAt: Date.now(),
      })
      .where(eq(candidateProfiles.id, id))
      .run();

    return this.getProfileById(id);
  },

  listProfiles() {
    const db = getDb();
    return db
      .select()
      .from(candidateProfiles)
      .orderBy(desc(candidateProfiles.updatedAt))
      .all()
      .map(mapProfile);
  },
};
