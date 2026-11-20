ALTER TABLE cutoff.questions DROP CONSTRAINT questions_difficulty_check,
  ADD CONSTRAINT questions_difficulty_check
    CHECK (difficulty IN ('easy', 'medium', 'hard', 'unrated'));

ALTER TABLE cutoff.question_options DROP CONSTRAINT question_options_option_label_check,
  ADD CONSTRAINT question_options_option_label_check
    CHECK (option_label ~ '^[A-Z1-4]$');
