ALTER TABLE interview_sessions
  ADD COLUMN resume_document_id text REFERENCES documents(id);

CREATE INDEX IF NOT EXISTS interview_sessions_resume_document_idx
  ON interview_sessions(resume_document_id);
