import { ExamText } from "./ExamText";
import { QuestionImage } from "./QuestionImage";
export function Question({ question, answer, onChange, disabled = false }) {
  function choose(label) {
    let selectedOptions = [label];
    if (question.question_type === "MULTIPLE_SELECT")
      selectedOptions = answer.selectedOptions.includes(label)
        ? answer.selectedOptions.filter((item) => item !== label)
        : [...answer.selectedOptions, label];
    onChange({ selectedOptions, numericalResponse: null });
  }
  return (
    <section className="question-body">
      <div className="question-meta">
        <span className="subject-tag">{question.subject_name}</span>
        <span>
          {question.question_type === "NUMERICAL"
            ? "Numerical answer"
            : question.question_type === "MULTIPLE_SELECT"
              ? "Select all correct options"
              : "Single correct option"}
        </span>
        <span className="marks">
          +{question.marks_correct} / {question.marks_incorrect}
        </span>
      </div>
      <h2>
        <ExamText text={question.question_text} />
      </h2>
      {question.images.map((url, index) => (
        <QuestionImage
          url={url}
          key={url}
          title={
            "Diagram " + (index + 1) + " for question " + question.position
          }
        />
      ))}
      {question.question_type === "NUMERICAL" ? (
        <label className="numeric-answer">
          Your answer
          <input
            type="number"
            step="any"
            value={answer.numericalResponse ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                numericalResponse:
                  event.target.value === "" ? null : Number(event.target.value),
                selectedOptions: [],
              })
            }
            placeholder="Enter a number"
          />
          <small>Decimals and negative values are accepted.</small>
        </label>
      ) : (
        <fieldset className="answer-options" disabled={disabled}>
          <legend className="sr-only">Choose your answer</legend>
          {question.options.map((option) => (
            <label
              className={
                "answer-option " +
                (answer.selectedOptions.includes(option.label)
                  ? "selected"
                  : "")
              }
              key={option.label}
            >
              <input
                type={
                  question.question_type === "MULTIPLE_SELECT"
                    ? "checkbox"
                    : "radio"
                }
                name={"question-" + question.question_id}
                checked={answer.selectedOptions.includes(option.label)}
                onChange={() => choose(option.label)}
              />
              <span className="option-letter">{option.label}</span>
              <span>
                <ExamText text={option.text} />
                {option.images.map((url) => (
                  <img
                    src={url}
                    className="question-image"
                    key={url}
                    alt={"Option " + option.label + " diagram"}
                    referrerPolicy="no-referrer"
                  />
                ))}
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </section>
  );
}
