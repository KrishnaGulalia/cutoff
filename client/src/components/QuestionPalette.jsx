export function QuestionPalette({
  questions,
  answers,
  current,
  onSelect,
  disabled,
}) {
  const subject = questions[current].subject_name;
  return (
    <aside className="question-palette">
      <h2>{subject}</h2>
      <p>Jump to a question in this subject.</p>
      <div className="palette-grid">
        {questions.map((question, index) => {
          if (question.subject_name !== subject) return null;
          const answer = answers[question.question_id];
          const answered =
            answer &&
            (answer.selectedOptions.length > 0 ||
              answer.numericalResponse !== null);
          const status = answer?.markedForReview
            ? "review"
            : answered
              ? "answered"
              : answer
                ? "visited"
                : "";
          return (
            <button
              key={question.question_id}
              disabled={disabled}
              className={status + (current === index ? " current" : "")}
              aria-label={
                "Question " +
                (index + 1) +
                (status ? ", " + status : ", not visited")
              }
              aria-current={current === index ? "step" : undefined}
              onClick={() => onSelect(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="palette-legend">
        <span>
          <i className="answered" />
          Answered
        </span>
        <span>
          <i className="review" />
          For review
        </span>
        <span>
          <i className="visited" />
          Visited
        </span>
        <span>
          <i />
          Not visited
        </span>
      </div>
      <p className="palette-note">
        Review flags don’t change scoring. Any saved answer will be evaluated.
      </p>
    </aside>
  );
}
