import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Clock } from "@phosphor-icons/react";
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
        <h1>Practice papers</h1>
        <p>Choose a paper to see its duration and marking scheme.</p>
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
          title="No papers found"
          description="Try a different title or exam year."
        />
      ) : (
        <div className="paper-list">
          {papers.data.map((paper) => (
            <Link
              className="paper-card"
              to={"/app/papers/" + paper.test_id}
              key={paper.test_id}
            >
              <div className="paper-card-number">
                <BookOpen size={24} aria-hidden="true" />
              </div>
              <div className="paper-card-main">
                <div className="paper-meta">
                  <span>{paper.exam_year}</span>
                  <span>JEE MAIN PAPER</span>
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
