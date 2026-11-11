import { useState } from "react";
import { Navigate, useNavigate, useParams, useBlocker } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Loading, ErrorState } from "../components/States";
import { Question } from "../components/Question";
import { QuestionPalette } from "../components/QuestionPalette";
import { Timer } from "../components/Timer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAttempt } from "../hooks/useAttempt";
export function AttemptPage() {
  const { id } = useParams();
  const attempt = useAttempt(id);
  const navigate = useNavigate();
  const blocker = useBlocker(() => attempt.hasUnsavedChanges());
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await attempt.submit();
      navigate("/app/attempts/" + id + "/results", { replace: true });
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  async function saveAndLeave() {
    setBusy(true);
    setError("");
    try {
      await attempt.save();
      blocker.proceed();
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  async function leave() {
    setBusy(true);
    setError("");
    try {
      await attempt.save();
      navigate("/app");
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  if (attempt.error) return <ErrorState message={attempt.error} />;
  if (!attempt.data) return <Loading text="Preparing your workspace…" />;
  const { questions, attempt: info } = attempt.data;
  if (info.attempt_status === "SUBMITTED")
    return <Navigate replace to={"/app/attempts/" + id + "/results"} />;
  const question = questions[attempt.index];
  const answered = Object.values(attempt.answers).filter(
    (answer) =>
      answer.selectedOptions.length || answer.numericalResponse !== null,
  ).length;
  return (
    <div className="exam-layout">
      <header className="exam-header">
        <Brand to="/app" />
        <div className="exam-title">
          <strong>{info.test_title}</strong>
          <span
            role="status"
            className={
              attempt.saveState.startsWith("Not saved") ? "save-error" : ""
            }
          >
            {attempt.saveState}
          </span>
        </div>
        <Timer
          expiresAt={info.expires_at}
          serverNow={info.server_now}
          onExpire={submit}
        />
        <button
          className="button secondary small"
          onClick={leave}
          disabled={busy}
        >
          Save & exit
        </button>
      </header>
      <main className="exam-main">
        <section className="question-panel">
          <div className="question-toolbar">
            <span>
              QUESTION{" "}
              <strong>{String(attempt.index + 1).padStart(2, "0")}</strong> /{" "}
              {questions.length}
            </span>
            <label className="review-toggle">
              <input
                type="checkbox"
                checked={attempt.currentAnswer.markedForReview}
                disabled={busy}
                onChange={(event) =>
                  attempt.change({ markedForReview: event.target.checked })
                }
              />
              Mark for review
            </label>
          </div>
          <Question
            question={question}
            answer={attempt.currentAnswer}
            onChange={attempt.change}
            disabled={busy}
          />
          {error && (
            <p role="alert" className="alert error">
              {error}
            </p>
          )}
          <div className="question-actions">
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                attempt.change({ selectedOptions: [], numericalResponse: null })
              }
            >
              Clear answer
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setError("");
                attempt.save().catch((error) => setError(error.message));
              }}
            >
              Save now
            </button>
            <div className="navigation-buttons">
              <button
                className="button secondary"
                disabled={busy || attempt.index === 0}
                onClick={() => attempt.navigate(attempt.index - 1)}
              >
                ← Previous
              </button>
              {attempt.index < questions.length - 1 ? (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => attempt.navigate(attempt.index + 1)}
                >
                  Next question →
                </button>
              ) : (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => setConfirm(true)}
                >
                  Review & submit
                </button>
              )}
            </div>
          </div>
        </section>
        <div className="exam-side">
          <QuestionPalette
            questions={questions}
            answers={attempt.answers}
            current={attempt.index}
            onSelect={attempt.navigate}
            disabled={busy}
          />
          <button
            className="button full"
            disabled={busy}
            onClick={() => setConfirm(true)}
          >
            {busy ? "Finishing…" : "Submit attempt"}
          </button>
          <p className="exam-hint">Take a breath. You’ve got time to think.</p>
        </div>
      </main>
      {blocker.state === "blocked" && (
        <ConfirmDialog onClose={() => !busy && blocker.reset()}>
          <h2>Save before you go.</h2>
          <p>
            Your latest changes are still on this page. Save them before
            leaving.
          </p>
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              autoFocus
              className="button secondary"
              disabled={busy}
              onClick={() => blocker.reset()}
            >
              Stay here
            </button>
            <button className="button" disabled={busy} onClick={saveAndLeave}>
              {busy ? "Saving…" : "Save and leave"}
            </button>
          </div>
        </ConfirmDialog>
      )}
      {confirm && blocker.state !== "blocked" && (
        <ConfirmDialog onClose={() => !busy && setConfirm(false)}>
          <span className="section-label">FINISH THIS ATTEMPT</span>
          <h2>Ready to see how you did?</h2>
          <p>
            {answered} answered · {questions.length - answered} unanswered.
          </p>
          <p>
            We’ll save your latest answers before submitting. You can’t edit
            this attempt afterwards.
          </p>
          {error && (
            <p role="alert" className="alert error">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              autoFocus
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Keep working
            </button>
            <button className="button" disabled={busy} onClick={submit}>
              {busy ? "Submitting…" : "Submit now"}
            </button>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
