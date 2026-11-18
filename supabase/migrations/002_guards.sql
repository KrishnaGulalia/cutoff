SET LOCAL search_path = cutoff, pg_catalog;

-- 6. Cross-table checks --------------------------------------------------------
-- PK/FK/CHECK constraints cannot alone check paper membership or response type.
-- Locking the attempt serializes response writes against submission, including
-- writes to different selected-option rows for the same attempt.

CREATE FUNCTION cutoff.guard_response() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = pg_catalog, cutoff AS $$
DECLARE
    response_attempt BIGINT;
    response_question BIGINT;
    current_attempt cutoff.attempts%ROWTYPE;
    kind TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        response_attempt := OLD.attempt_id;
        response_question := OLD.question_id;
    ELSE
        response_attempt := NEW.attempt_id;
        response_question := NEW.question_id;
        IF TG_OP = 'UPDATE' AND
           (NEW.attempt_id, NEW.question_id) IS DISTINCT FROM
           (OLD.attempt_id, OLD.question_id) THEN
            RAISE EXCEPTION 'An answer cannot be moved to a different attempt or question'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    SELECT * INTO current_attempt FROM cutoff.attempts
        WHERE attempt_id = response_attempt FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt % does not exist', response_attempt USING ERRCODE = '23503';
    END IF;
    IF current_attempt.attempt_status <> 'IN_PROGRESS' THEN
        RAISE EXCEPTION 'Submitted attempt % cannot be edited', response_attempt
            USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM cutoff.test_questions
        WHERE test_id = current_attempt.test_id AND question_id = response_question
    ) THEN
        RAISE EXCEPTION 'Question % is not in this attempt''s paper', response_question
            USING ERRCODE = '23514';
    END IF;
    SELECT question_type INTO kind FROM cutoff.questions WHERE question_id = response_question;

    IF TG_TABLE_NAME = 'answers' THEN
        IF kind <> 'NUMERICAL' AND NEW.numerical_response IS NOT NULL THEN
            RAISE EXCEPTION 'A choice question cannot have a numerical response'
                USING ERRCODE = '23514';
        END IF;
        NEW.answer_updated_at := clock_timestamp();
    ELSE
        IF kind = 'NUMERICAL' THEN
            RAISE EXCEPTION 'A numerical question cannot have selected options'
                USING ERRCODE = '23514';
        END IF;
        IF kind = 'SINGLE_CHOICE' THEN
            IF TG_OP = 'INSERT' AND EXISTS (
                SELECT 1 FROM cutoff.answer_options
                WHERE attempt_id = response_attempt AND question_id = response_question
            ) THEN
                RAISE EXCEPTION 'A single-choice response can contain only one option'
                    USING ERRCODE = '23514';
            ELSIF TG_OP = 'UPDATE' AND EXISTS (
                SELECT 1 FROM cutoff.answer_options
                WHERE attempt_id = response_attempt AND question_id = response_question
                  AND option_label <> OLD.option_label
            ) THEN
                RAISE EXCEPTION 'A single-choice response can contain only one option'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER answers_guard BEFORE INSERT OR UPDATE OR DELETE ON answers
    FOR EACH ROW EXECUTE FUNCTION cutoff.guard_response();
CREATE TRIGGER answer_options_guard BEFORE INSERT OR UPDATE OR DELETE ON answer_options
    FOR EACH ROW EXECUTE FUNCTION cutoff.guard_response();

-- Changing selected options also changes the parent answer's last-updated time.
CREATE FUNCTION cutoff.touch_answer() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = pg_catalog, cutoff AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE cutoff.answers SET answer_updated_at = clock_timestamp()
        WHERE attempt_id = OLD.attempt_id AND question_id = OLD.question_id;
        RETURN OLD;
    END IF;
    UPDATE cutoff.answers SET answer_updated_at = clock_timestamp()
    WHERE attempt_id = NEW.attempt_id AND question_id = NEW.question_id;
    RETURN NEW;
END;
$$;
CREATE TRIGGER answer_options_touch AFTER INSERT OR UPDATE OR DELETE ON answer_options
    FOR EACH ROW EXECUTE FUNCTION cutoff.touch_answer();

CREATE FUNCTION cutoff.guard_attempt() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = pg_catalog, cutoff AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.attempt_status <> 'IN_PROGRESS' THEN
            RAISE EXCEPTION 'A new attempt must start IN_PROGRESS' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;
    IF OLD.attempt_status = 'SUBMITTED' THEN
        RAISE EXCEPTION 'A submitted attempt is retained unchanged' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    IF (NEW.attempt_id, NEW.user_id, NEW.test_id, NEW.started_at) IS DISTINCT FROM
       (OLD.attempt_id, OLD.user_id, OLD.test_id, OLD.started_at) THEN
        RAISE EXCEPTION 'Attempt identity, owner, paper and start time are immutable'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER attempts_guard BEFORE INSERT OR UPDATE OR DELETE ON attempts
    FOR EACH ROW EXECUTE FUNCTION cutoff.guard_attempt();

CREATE FUNCTION cutoff.touch_user() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = pg_catalog, cutoff AS $$
BEGIN
    NEW.user_updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;
CREATE TRIGGER users_touch BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION cutoff.touch_user();

-- Topic membership is checked at transaction end, allowing a coordinated
-- reclassification to update the question and its topic together.
CREATE FUNCTION cutoff.check_topic_chapter() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = pg_catalog, cutoff AS $$
DECLARE
    target_question BIGINT;
    target_topic BIGINT;
BEGIN
    IF TG_TABLE_NAME = 'topics' THEN
        target_topic := NEW.topic_id;
    ELSE
        target_question := NEW.question_id;
    END IF;
    IF EXISTS (
        SELECT 1 FROM cutoff.question_topics qt
        JOIN cutoff.questions q ON q.question_id = qt.question_id
        JOIN cutoff.topics t ON t.topic_id = qt.topic_id
        WHERE q.chapter_id <> t.chapter_id
          AND (q.question_id = target_question OR t.topic_id = target_topic)
    ) THEN
        RAISE EXCEPTION 'The assigned topic must belong to the question''s chapter'
            USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER question_topics_chapter_check
    AFTER INSERT OR UPDATE ON question_topics DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION cutoff.check_topic_chapter();
CREATE CONSTRAINT TRIGGER questions_topic_chapter_check
    AFTER UPDATE ON questions DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION cutoff.check_topic_chapter();
CREATE CONSTRAINT TRIGGER topics_question_chapter_check
    AFTER UPDATE ON topics DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION cutoff.check_topic_chapter();

