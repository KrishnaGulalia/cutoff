import { ExamText } from "./ExamText";
import { QuestionImage } from "./QuestionImage";
import { useState, useRef, useEffect } from "react";
import { formatTime } from "../lib/formatTime";
export function QuestionReview({ questions, selectedPosition, initialFilter }) {
  const [filter, setFilter] = useState(initialFilter);
  const [subject, setSubject] = useState("all");
  const selectedRef = useRef(null);
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "center" });
      selectedRef.current
        .querySelector("summary")
        ?.focus({ preventScroll: true });
    }
  }, [selectedPosition]);
  const visible = questions.filter(
    (q) =>
      (subject === "all" || q.subject_name === subject) &&
      (filter === "all" ||
        q.outcome === filter ||
        (filter === "flagged" && q.markedForReview)),
  );
  return (
    <section className="report-section">
      <div className="review-toolbar">
        <h2>Question review</h2>
        <label>
          Subject
          <select
            aria-label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="all">All subjects</option>
            {[...new Set(questions.map((q) => q.subject_name))].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Show
          <select
            aria-label="Show"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All questions</option>
            <option value="incorrect">Incorrect</option>
            <option value="unattempted">Skipped</option>
            <option value="correct">Correct</option>
            <option value="flagged">Marked for review</option>
          </select>
        </label>
      </div>
      <p className="review-total" role="status">
        {visible.length} of {questions.length} questions
      </p>
      {!visible.length && <p>No questions match these filters.</p>}
      {visible.map((question) => (
        <details
          className="review-question"
          key={question.question_id}
          open={question.position === selectedPosition || undefined}
          ref={question.position === selectedPosition ? selectedRef : undefined}
        >
          <summary>
            <span className="review-number">Q{question.position}</span>
            <span>
              <ExamText text={question.question_text} />
            </span>
            <span className={"badge " + question.outcome}>
              {question.outcome === "unattempted"
                ? "Skipped"
                : question.outcome}
            </span>
            <strong>
              {question.marksAwarded > 0 ? "+" : ""}
              {question.marksAwarded}
            </strong>
          </summary>
          <div className="review-content">
            <p className="muted">
              {question.subject_name} / {question.chapter_name} ·{" "}
              {formatTime(question.timeSpentSeconds)}
              {question.markedForReview ? " · Marked for review" : ""}
            </p>
            {question.images.map((url, index) => (
              <QuestionImage
                url={url}
                key={url}
                title={
                  "Diagram " +
                  (index + 1) +
                  " for question " +
                  question.position
                }
              />
            ))}
            {question.options.map((option) => (
              <p
                className={
                  question.correctOptions.includes(option.label)
                    ? "correct-key"
                    : ""
                }
                key={option.label}
              >
                <strong>{option.label}.</strong> <ExamText text={option.text} />
                {option.images.map((url) => (
                  <img
                    className="question-image"
                    src={url}
                    key={url}
                    alt={"Option " + option.label}
                  />
                ))}
                {question.correctOptions.includes(option.label) ? " ✓" : ""}
              </p>
            ))}
            <div className="answer-comparison">
              <p>
                <strong>Your answer</strong>
                <br />
                {question.question_type === "NUMERICAL"
                  ? (question.numericalResponse ?? "Not answered")
                  : question.selectedOptions.join(", ") || "Not answered"}
              </p>
              <p>
                <strong>Correct answer</strong>
                <br />
                {question.numericalKey
                  ? question.numericalKey.accepted_min ===
                    question.numericalKey.accepted_max
                    ? question.numericalKey.accepted_min
                    : question.numericalKey.accepted_min +
                      " to " +
                      question.numericalKey.accepted_max
                  : question.correctOptions.join(", ")}
              </p>
            </div>
            {question.explanation_text && (
              <>
                <h3>Why it works</h3>
                <p className="explanation">{question.explanation_text}</p>
              </>
            )}
          </div>
        </details>
      ))}
    </section>
  );
}
