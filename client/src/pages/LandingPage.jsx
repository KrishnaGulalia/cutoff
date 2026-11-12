import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useState } from "react";
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";
export function LandingPage() {
  const { session } = useAuth();
  const [choice, setChoice] = useState("");
  return (
    <div className="landing landing-study">
      <header className="public-nav">
        <Brand />
        <nav>
          <a href="#analysis">Test analysis</a>
          <Link to={session ? "/app" : "/login"}>
            {session ? "My workspace" : "Sign in"} <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="edition">JEE MAIN PRACTICE</div>
            <h1>
              Practice with
              <br />a <span className="highlight-word">point.</span>
            </h1>
            <p>
              Take a timed paper. See where your marks came from and which
              questions took your time.
            </p>
            <Link className="button lime" to={session ? "/app" : "/signup"}>
              {session ? "Open workspace" : "Start practising"}{" "}
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="practice-preview">
            <div className="preview-top">
              <span>Physics warm-up</span>
              <span>Kinematics</span>
            </div>
            <div className="preview-body">
              <div className="motion-strip" aria-hidden="true">
                <span>0 m</span>
                <i />
                <span>20 m</span>
              </div>
              <h2>
                A particle travels 20 metres in 4 seconds. What is its average
                speed?
              </h2>
              <div className="preview-options">
                {["4 m/s", "5 m/s", "8 m/s", "80 m/s"].map((label, i) => (
                  <button
                    key={label}
                    aria-pressed={choice === label}
                    className={choice === label ? "chosen" : ""}
                    onClick={() => setChoice(label)}
                  >
                    <span>{String.fromCharCode(65 + i)}</span>
                    {label}
                  </button>
                ))}
              </div>
              <p className="preview-feedback" aria-live="polite">
                {!choice
                  ? "Choose an answer to check your working."
                  : choice === "5 m/s"
                    ? "Correct. 20 m ÷ 4 s = 5 m/s."
                    : "Divide the distance by the time and try again."}
              </p>
            </div>
          </div>
        </section>
        <section id="analysis" className="landing-analysis">
          <h2>After the test</h2>
          <div>
            <h3>Score breakdown</h3>
            <p>
              Compare marks and accuracy across subjects, chapters and
              difficulty levels.
            </p>
          </div>
          <div>
            <h3>Time analysis</h3>
            <p>
              Find the questions that took the longest and open their solutions.
            </p>
          </div>
          <div>
            <h3>Question review</h3>
            <p>
              Revisit mistakes, skipped questions and anything you marked for
              review.
            </p>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>JEE Main practice</span>
      </footer>
    </div>
  );
}
