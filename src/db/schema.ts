import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const candidateProfiles = sqliteTable("candidate_profiles", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  headline: text("headline"),
  email: text("email"),
  yearsExperience: integer("years_experience"),
  targetRolesJson: text("target_roles_json").notNull().default("[]"),
  primaryDomain: text("primary_domain"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    candidateProfileId: text("candidate_profile_id")
      .notNull()
      .references(() => candidateProfiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title"),
    sourceFilename: text("source_filename"),
    mimeType: text("mime_type"),
    rawText: text("raw_text").notNull(),
    parsedJson: text("parsed_json"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("documents_profile_type_idx").on(table.candidateProfileId, table.type)],
);

export const documentChunks = sqliteTable("document_chunks", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  text: text("text").notNull(),
  tokenEstimate: integer("token_estimate"),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at").notNull(),
});

export const interviewPersonas = sqliteTable("interview_personas", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  configJson: text("config_json").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const interviewSessions = sqliteTable(
  "interview_sessions",
  {
    id: text("id").primaryKey(),
    candidateProfileId: text("candidate_profile_id")
      .notNull()
      .references(() => candidateProfiles.id, { onDelete: "cascade" }),
    personaId: text("persona_id")
      .notNull()
      .references(() => interviewPersonas.id),
    interviewType: text("interview_type").notNull(),
    difficulty: text("difficulty").notNull(),
    interestLevel: text("interest_level").notNull(),
    mode: text("mode").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    status: text("status").notNull(),
    jobDocumentId: text("job_document_id").references(() => documents.id),
    companyName: text("company_name"),
    companyContextJson: text("company_context_json"),
    panelJson: text("panel_json"),
    planJson: text("plan_json"),
    startedAt: integer("started_at"),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("interview_sessions_profile_created_idx").on(table.candidateProfileId, table.createdAt),
  ],
);

export const transcriptTurns = sqliteTable(
  "transcript_turns",
  {
    id: text("id").primaryKey(),
    interviewSessionId: text("interview_session_id")
      .notNull()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    turnIndex: integer("turn_index").notNull(),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    questionCategory: text("question_category"),
    interviewerKey: text("interviewer_key"),
    metadataJson: text("metadata_json"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("transcript_turns_session_turn_idx").on(table.interviewSessionId, table.turnIndex)],
);

export const scores = sqliteTable(
  "scores",
  {
    id: text("id").primaryKey(),
    interviewSessionId: text("interview_session_id")
      .notNull()
      .unique()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    overallScore: real("overall_score").notNull(),
    clarityScore: real("clarity_score").notNull(),
    relevanceScore: real("relevance_score").notNull(),
    evidenceScore: real("evidence_score").notNull(),
    structureScore: real("structure_score").notNull(),
    roleFitScore: real("role_fit_score").notNull(),
    confidenceScore: real("confidence_score").notNull(),
    band: text("band").notNull(),
    summary: text("summary").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("scores_session_idx").on(table.interviewSessionId)],
);

export const feedbackItems = sqliteTable(
  "feedback_items",
  {
    id: text("id").primaryKey(),
    interviewSessionId: text("interview_session_id")
      .notNull()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    severity: text("severity"),
    sourceTurnIdsJson: text("source_turn_ids_json"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("feedback_items_session_category_idx").on(table.interviewSessionId, table.category),
  ],
);

export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  valueJson: text("value_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const schema = {
  candidateProfiles,
  documents,
  documentChunks,
  interviewPersonas,
  interviewSessions,
  transcriptTurns,
  scores,
  feedbackItems,
  appSettings,
};

export const documentsFtsSql = sql`
  CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    id UNINDEXED,
    candidate_profile_id UNINDEXED,
    type UNINDEXED,
    title,
    raw_text
  );
`;

export const documentChunksFtsSql = sql`
  CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
    id UNINDEXED,
    document_id UNINDEXED,
    text
  );
`;

export const transcriptTurnsFtsSql = sql`
  CREATE VIRTUAL TABLE IF NOT EXISTS transcript_turns_fts USING fts5(
    id UNINDEXED,
    interview_session_id UNINDEXED,
    speaker UNINDEXED,
    text
  );
`;
