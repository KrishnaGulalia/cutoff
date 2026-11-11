import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { Loading, ErrorState } from "../components/States";
export function PaperPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const paper = useResource("/papers/" + id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      const attempt = await api("/papers/" + id + "/attempts", {
        method: "POST",
      });
      navigate("/app/attempts/" + attempt.attempt_id);
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  if (paper.loading) return <Loading />;
  if (paper.error)
    return <ErrorState message={paper.error} retry={paper.reload} />;
  const item = paper.data;
  return (
    <>
      <Link className="back-link" to="/app/papers">
        ← All papers
      </Link>
      <header className="page-heading">
        <span className="section-label">BEFORE YOU BEGIN</span>
        <h1>{item.test_title}</h1>
        <p>{item.session_label}</p>
      </header>
      <div className="paper-detail">
        <section>
          <div className="stat-strip">
            <div>
              <span>{item.duration_minutes}</span>
              <p>Minutes</p>
            </div>
            <div>
              <span>{item.question_count}</span>
              <p>Questions</p>
            </div>
            <div>
              <span>{item.maximum_marks}</span>
              <p>Maximum marks</p>
            </div>
          </div>
          <h2>A focused attempt.</h2>
          <ol className="instructions">
            <li>
              The timer starts when you begin and keeps running if you leave.
            </li>
            <li>
              Your answers save automatically. Check the save indicator before
              leaving.
            </li>
            <li>
              You can mark a question for review, clear it, or return to it
              later.
            </li>
            <li>
              Multiple-select questions require every correct option and no
              extra options.
            </li>
            <li>
              Each question shows its marking scheme. Unanswered questions
              receive zero.
            </li>
            <li>
              Submission ends the attempt. You can review your result or start a
              new attempt.
            </li>
          </ol>
        </section>
        <aside className="start-panel">
          <span className="section-label">READY WHEN YOU ARE</span>
          <h2>
            Make this
            <br />
            attempt yours.
          </h2>
          <p>
            {item.is_demo
              ? "This is original demo material, not a historical JEE paper."
              : item.source_reference}
          </p>
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          <button className="button lime full" disabled={busy} onClick={start}>
            {busy ? "Opening paper…" : "Start or resume →"}
          </button>
          <small>
            Already started? We’ll take you back to your saved attempt.
          </small>
        </aside>
      </div>
    </>
  );
}
