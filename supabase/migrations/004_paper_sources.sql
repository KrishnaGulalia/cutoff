-- These two metadata fields distinguish original demo material from real papers.
ALTER TABLE cutoff.tests ADD COLUMN source_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE cutoff.tests ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX attempts_user_started ON cutoff.attempts(user_id, started_at DESC);
CREATE INDEX test_questions_question ON cutoff.test_questions(question_id);
