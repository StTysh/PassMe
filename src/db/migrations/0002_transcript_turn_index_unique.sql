CREATE UNIQUE INDEX IF NOT EXISTS transcript_turns_session_turn_unique_idx
  ON transcript_turns (interview_session_id, turn_index);
