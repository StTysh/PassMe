-- Add company and panel columns to interview_sessions
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS company_context_json TEXT;
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS panel_json TEXT;

-- Add interviewer_key to transcript_turns for multi-interviewer tracking
ALTER TABLE transcript_turns ADD COLUMN IF NOT EXISTS interviewer_key TEXT;
