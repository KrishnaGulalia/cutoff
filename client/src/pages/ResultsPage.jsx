import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import { useResource } from "../hooks/useResource";
import { Loading, ErrorState } from "../components/States";
import { Analytics } from "../components/Analytics";
import { TimeAnalysis } from "../components/TimeAnalysis";
import { QuestionReview } from "../components/QuestionReview";
import { formatTime } from "../lib/formatTime";
const views = {
  overview: "Overview",
  time: "Time analysis",
  review: "Question review",
};
export function ResultsPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const requested = params.get("view");
  const view = Object.hasOwn(views, requested) ? requested : "overview";
  const result = useResource("/attempts/" + id + "/results");
  if (result.loading) return <Loading text="Loading test analysis…" />;
  if (result.error)
    return <ErrorState message={result.error} retry={result.reload} />;
  const { summary, questions, analytics, attempt } = result.data;
  const attempted = summary.correct + summary.incorrect;
  const penalty = Number(
    (-questions.reduce(
      (sum, q) => sum + Math.min(q.marksAwarded, 0),
      0,
    )).toFixed(2),
  );
  const outcomes = [
    ["Correct", summary.correct, "correct"],
    ["Incorrect", summary.incorrect, "incorrect"],
    ["Skipped", summary.skipped, "unattempted"],
  ];
  const correctShare = summary.questionCount
    ? (summary.correct / summary.questionCount) * 100
    : 0;
  const attemptedShare = summary.questionCount
    ? (attempted / summary.questionCount) * 100
    : 0;
  return (
    <article className="test-report">
      <Link className="back-link" to="/app/history">
        <ArrowLeft size={14} /> My attempts
      </Link>
      <header className="report-heading">
        <div>
          <h1>Test analysis</h1>
          <p>
            {attempt.test_title} <span>·</span>{" "}
            {new Date(attempt.submitted_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          className="button secondary small"
          to={"/app/papers/" + attempt.test_id}
        >
          Retake paper <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="score-sheet" aria-label="Attempt summary">
        <div className="report-score">
          <span>Final score</span>
          <strong>
            {summary.score}
            <small> / {summary.maximumMarks}</small>
          </strong>
          <p>
            {summary.accuracy === null
              ? "No questions attempted"
              : summary.accuracy + "% accuracy on attempted questions"}
          </p>
        </div>
        <div className="report-outcomes">
          <div
            className="outcome-ring"
            aria-hidden="true"
            style={{
              background: `conic-gradient(#acf0c6 0 ${correctShare}%, #ffb09c ${correctShare}% ${attemptedShare}%, #56716f ${attemptedShare}% 100%)`,
            }}
          >
            <div>
              <strong>
                {attempted}/{summary.questionCount}
              </strong>
              <small>attempted</small>
            </div>
          </div>
          <div className="outcome-legend">
            {outcomes.map(([label, count, key]) => (
              <Link
                key={key}
                aria-label={
                  "Review " + count + " " + label.toLowerCase() + " questions"
                }
                to={"?view=review&filter=" + key}
              >
                <i className={"dot-" + key} />
                {label}
                <b>{count}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <nav className="report-nav" aria-label="Analysis sections">
        {Object.entries(views).map(([key, label]) => (
          <Link
            aria-current={view === key ? "page" : undefined}
            key={key}
            to={"?view=" + key}
          >
            {label}
          </Link>
        ))}
      </nav>
      {view === "overview" && (
        <>
          <Analytics data={analytics} />
          <section className="question-map">
            <h2>Question map</h2>
            <p>Select a question to open its solution.</p>
            <div>
              {questions.map((q) => (
                <Link
                  key={q.question_id}
                  to={"?view=review&question=" + q.position}
                  className={"map-" + q.outcome}
                  aria-label={
                    "Review question " +
                    q.position +
                    ", " +
                    (q.outcome === "unattempted" ? "skipped" : q.outcome)
                  }
                >
                  {q.position}
                  <small aria-hidden="true">
                    {
                      { correct: "✓", incorrect: "×", unattempted: "–" }[
                        q.outcome
                      ]
                    }
                  </small>
                </Link>
              ))}
            </div>
          </section>
          {penalty > 0 && (
            <p className="penalty-note">
              <strong>
                {penalty} {penalty === 1 ? "mark" : "marks"} deducted
              </strong>{" "}
              for incorrect answers.{" "}
              <Link to="?view=review&filter=incorrect">Review mistakes ↗</Link>
            </p>
          )}
          <div className="report-time-link">
            <div>
              <strong>{formatTime(summary.timeSeconds)}</strong>
              <span> recorded on questions</span>
            </div>
            <Link to="?view=time">Explore time analysis ↗</Link>
          </div>
        </>
      )}
      {view === "time" && (
        <TimeAnalysis
          subjects={analytics.subjects}
          questions={questions}
          total={summary.timeSeconds}
        />
      )}
      {view === "review" && (
        <QuestionReview
          key={id + params.toString()}
          questions={questions}
          selectedPosition={Number(params.get("question"))}
          initialFilter={
            ["incorrect", "correct", "unattempted", "flagged"].includes(
              params.get("filter"),
            )
              ? params.get("filter")
              : "all"
          }
        />
      )}
    </article>
  );
}
