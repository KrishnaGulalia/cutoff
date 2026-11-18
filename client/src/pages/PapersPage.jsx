import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "@phosphor-icons/react";
import { useResource } from "../hooks/useResource";
import { Loading, ErrorState, EmptyState } from "../components/States";
export function PapersPage() {
  const [filters, setFilters] = useState("");
  const papers = useResource("/papers" + filters);
  function search(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFilters(
      "?" +
        new URLSearchParams({
          search: form.get("search"),
          year: form.get("year"),
        }),
    );
  }
  return (
    <>
      <header className="page-heading">
        <span className="section-label">THE PRACTICE LIBRARY</span>
        <h1>
          Find your next
          <br />
          <span>challenge.</span>
        </h1>
        <p>Take a paper at your pace. Learn from it at your depth.</p>
      </header>
      <form className="filter-bar" onSubmit={search}>
        <label>
          Search papers
          <input name="search" type="search" placeholder="Paper title…" />
        </label>
        <label>
          Exam year
          <input
            name="year"
            type="number"
            min="2000"
            max="9999"
            placeholder="Any year"
          />
        </label>
        <button className="button secondary">Find papers</button>
      </form>
      {papers.loading ? (
        <Loading text="Opening the library…" />
      ) : papers.error ? (
        <ErrorState message={papers.error} retry={papers.reload} />
      ) : !papers.data.length ? (
        <EmptyState
          title="A little space for what’s next."
          description="No papers match this view yet. Try another search or come back as the library grows."
        />
      ) : (
        <div className="paper-list">
          {papers.data.map((paper, index) => (
            <Link
              className="paper-card"
              to={"/app/papers/" + paper.test_id}
              key={paper.test_id}
            >
              <div className="paper-card-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="paper-card-main">
                <div className="paper-meta">
                  <span>{paper.exam_year}</span>
                  <span>
                    {paper.is_demo
                      ? "ORIGINAL PRACTICE"
                      : "PREVIOUS-YEAR PAPER"}
                  </span>
                </div>
                <h2>{paper.test_title}</h2>
                <p>{paper.session_label}</p>
                <div className="paper-facts">
                  <span>
                    <Clock size={16} />
                    {paper.duration_minutes} min
                  </span>
                  <span>{paper.question_count} questions</span>
                  <span>{paper.maximum_marks} marks</span>
                </div>
              </div>
              <ArrowUpRight className="paper-arrow" size={28} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
