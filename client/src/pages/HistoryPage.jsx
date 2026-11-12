import { Link } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { Loading, ErrorState, EmptyState } from "../components/States";
export function HistoryPage() {
  const history = useResource("/attempts");
  return (
    <>
      <header className="page-heading">
        <h1>My attempts</h1>
        <p>Resume a paper or open the analysis for a submitted attempt.</p>
      </header>
      {history.loading ? (
        <Loading />
      ) : history.error ? (
        <ErrorState message={history.error} retry={history.reload} />
      ) : !history.data.length ? (
        <EmptyState
          title="No attempts yet"
          description="Start a practice paper and your attempts will appear here."
          to="/app/papers"
          action="Explore papers"
        />
      ) : (
        <div className="history-list">
          {history.data.map((item) => (
            <Link
              className="attempt-row"
              key={item.attempt_id}
              to={
                "/app/attempts/" +
                item.attempt_id +
                (item.attempt_status === "SUBMITTED" ? "/results" : "")
              }
            >
              <div>
                <span className="muted">ATTEMPT #{item.attempt_id}</span>
                <h2>{item.test_title}</h2>
                <p>
                  {new Date(item.started_at).toLocaleString()}
                  {item.is_demo ? " · Original demo" : ""}
                </p>
              </div>
              <span
                className={
                  "badge " +
                  (item.attempt_status === "SUBMITTED" ? "complete" : "")
                }
              >
                {item.attempt_status === "SUBMITTED"
                  ? "View analysis ↗"
                  : "Resume →"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
