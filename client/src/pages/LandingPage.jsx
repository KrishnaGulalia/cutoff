import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";
export function LandingPage() {
  const { session } = useAuth();
  const [choice, setChoice] = useState("");
  return (
    <div className="landing">
      <header className="public-nav">
        <Brand />
        <nav>
          <a href="#how">The approach</a>
          <Link to={session ? "/app" : "/login"}>
            Sign in <ArrowUpRight size={17} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="edition">JEE PRACTICE, WITH PERSPECTIVE</div>
            <h1>
              Practice with
              <br />a <span className="highlight-word">point.</span>
            </h1>
            <p>
              Turn every paper into a clearer picture of what to work on next.
            </p>
            <Link className="button lime" to={session ? "/app" : "/signup"}>
              {session ? "Open your workspace" : "Find your starting point"}
              <ArrowUpRight size={21} />
            </Link>
          </div>
          <div className="practice-preview">
            <div className="preview-top">
              <span>THE WARM-UP</span>
              <span>01 / 01</span>
            </div>
            <div className="preview-body">
              <span className="subject-tag">PHYSICS · MOTION</span>
              <h2>
                20 metres.
                <br />4 seconds.
                <br />
                What’s the speed?
              </h2>
              <div className="preview-options">
                {["4 m/s", "5 m/s", "8 m/s", "80 m/s"].map((label, i) => (
                  <button
                    key={label}
                    className={choice === label ? "chosen" : ""}
                    aria-pressed={choice === label}
                    onClick={() => setChoice(label)}
                  >
                    <span>{String.fromCharCode(65 + i)}</span>
                    {label}
                  </button>
                ))}
              </div>
              <p className="preview-feedback" aria-live="polite">
                {!choice
                  ? "A tiny original practice question. Give it a go."
                  : choice === "5 m/s"
                    ? "Exactly. Speed = distance ÷ time. You’re in motion."
                    : "Almost. Divide the distance by the time. Try again."}
              </p>
            </div>
            <div className="preview-footer">
              <span>Small steps. Clearer thinking.</span>
              <ArrowUpRight size={22} />
            </div>
          </div>
        </section>
        <section className="approach" id="how">
          <div>
            <span className="section-label">A BETTER PRACTICE LOOP</span>
            <h2>
              Finish the paper.
              <br />
              Keep the insight.
            </h2>
          </div>
          <div className="approach-list">
            <article>
              <span>01</span>
              <div>
                <h3>Get into test mode.</h3>
                <p>
                  A focused workspace, a real timer, and your place saved as you
                  go.
                </p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Go beyond the total.</h3>
                <p>
                  See accuracy, time spent, and performance across subjects and
                  chapters.
                </p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Know your next move.</h3>
                <p>
                  Review each answer. Understand the mistakes. Come back for
                  another attempt.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section className="closing">
          <h2>
            Your next attempt
            <br />
            starts here.
          </h2>
          <Link className="button" to={session ? "/app/papers" : "/signup"}>
            Let’s make it count <ArrowRight size={20} />
          </Link>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <p>Built for the work between attempts.</p>
        <span>JEE Main practice</span>
      </footer>
    </div>
  );
}
