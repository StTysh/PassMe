CREATE UNIQUE INDEX IF NOT EXISTS document_chunks_document_chunk_unique_idx
  ON document_chunks(document_id, chunk_index);

CREATE INDEX IF NOT EXISTS interview_sessions_job_document_idx
  ON interview_sessions(job_document_id);

CREATE INDEX IF NOT EXISTS interview_sessions_profile_status_idx
  ON interview_sessions(candidate_profile_id, status);
