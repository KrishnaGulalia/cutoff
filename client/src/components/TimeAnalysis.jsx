import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { formatTime } from "../lib/formatTime";
export function TimeAnalysis({ questions, subjects, total }) {
  const longest = questions
    .filter((q) => q.timeSpentSeconds > 0)
    .sort(
      (a, b) =>
        b.timeSpentSeconds - a.timeSpentSeconds || a.position - b.position,
    )
    .slice(0, 5);
  return (
    <section className="report-section time-analysis">
      <div>
        <h2>Time by subject</h2>
        <p>Active time recorded while viewing questions.</p>
        {subjects.map((subject) => (
          <div className="time-row" key={subject.name}>
            <div>
              <strong>{subject.name}</strong>
              <span>{formatTime(subject.timeSeconds)}</span>
            </div>
            <meter
              aria-label={subject.name + " share of recorded time"}
              min={0}
              max={Math.max(1, total)}
              value={subject.timeSeconds}
            />
          </div>
        ))}
      </div>
      <div>
        <h2>Longest questions</h2>
        <p>Open a question to review your response.</p>
        {longest.length ? (
          <ol className="time-list">
            {longest.map((q) => (
              <li key={q.question_id}>
                <Link to={"?view=review&question=" + q.position}>
                  <b>Q{q.position}</b>
                  <span>
                    {q.subject_name}
                    <small>
                      {q.chapter_name} ·{" "}
                      {q.outcome === "unattempted" ? "skipped" : q.outcome}
                    </small>
                  </span>
                  <strong>{formatTime(q.timeSpentSeconds)}</strong>
                  <ArrowUpRight size={16} />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p>No question time was recorded for this attempt.</p>
        )}
      </div>
    </section>
  );
}
