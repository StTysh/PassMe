CREATE TABLE IF NOT EXISTS candidate_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT NOT NULL,
  headline TEXT,
  email TEXT,
  years_experience INTEGER,
  target_roles_json TEXT NOT NULL DEFAULT '[]',
  primary_domain TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  candidate_profile_id TEXT NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  source_filename TEXT,
  mime_type TEXT,
  raw_text TEXT NOT NULL,
  parsed_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS documents_profile_type_idx ON documents(candidate_profile_id, type);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  token_estimate INTEGER,
  metadata_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_personas (
  id TEXT PRIMARY KEY NOT NULL,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  config_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  candidate_profile_id TEXT NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL REFERENCES interview_personas(id),
  interview_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  interest_level TEXT NOT NULL,
  mode TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL,
  job_document_id TEXT REFERENCES documents(id),
  plan_json TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS interview_sessions_profile_created_idx
  ON interview_sessions(candidate_profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS transcript_turns (
  id TEXT PRIMARY KEY NOT NULL,
  interview_session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  turn_index INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  question_category TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS transcript_turns_session_turn_idx
  ON transcript_turns(interview_session_id, turn_index);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY NOT NULL,
  interview_session_id TEXT NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
  overall_score REAL NOT NULL,
  clarity_score REAL NOT NULL,
  relevance_score REAL NOT NULL,
  evidence_score REAL NOT NULL,
  structure_score REAL NOT NULL,
  role_fit_score REAL NOT NULL,
  confidence_score REAL NOT NULL,
  band TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback_items (
  id TEXT PRIMARY KEY NOT NULL,
  interview_session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT,
  source_turn_ids_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_items_session_category_idx
  ON feedback_items(interview_session_id, category);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY NOT NULL,
  key TEXT NOT NULL UNIQUE,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  id UNINDEXED,
  candidate_profile_id UNINDEXED,
  type UNINDEXED,
  title,
  raw_text
);

CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
  id UNINDEXED,
  document_id UNINDEXED,
  text
);

CREATE VIRTUAL TABLE IF NOT EXISTS transcript_turns_fts USING fts5(
  id UNINDEXED,
  interview_session_id UNINDEXED,
  speaker UNINDEXED,
  text
);
