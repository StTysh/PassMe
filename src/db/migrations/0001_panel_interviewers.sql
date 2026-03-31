-- Add company and panel columns to interview_sessions
ALTER TABLE interview_sessions ADD COLUMN company_name TEXT;
ALTER TABLE interview_sessions ADD COLUMN company_context_json TEXT;
ALTER TABLE interview_sessions ADD COLUMN panel_json TEXT;

-- Add interviewer_key to transcript_turns for multi-interviewer tracking
ALTER TABLE transcript_turns ADD COLUMN interviewer_key TEXT;
