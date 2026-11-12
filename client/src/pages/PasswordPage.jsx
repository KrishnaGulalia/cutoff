import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "../components/States";
import { Brand } from "../components/Brand";
import { supabase } from "../lib/supabase";
export function PasswordPage({ reset = false }) {
  const { session, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!supabase) throw new Error("Authentication is not available yet.");
      const form = new FormData(event.currentTarget);
      const result = reset
        ? await supabase.auth.updateUser({ password: form.get("password") })
        : await supabase.auth.resetPasswordForEmail(form.get("email"), {
            redirectTo: window.location.origin + "/reset-password",
          });
      if (result.error) throw result.error;
      setMessage(
        reset
          ? "Password updated. You can continue to your workspace."
          : "If an account exists, a reset link will arrive in your inbox.",
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (reset && loading) return <Loading text="Checking your reset link…" />;
  const redirectError =
    new URLSearchParams(window.location.hash.slice(1)).has("error") ||
    new URLSearchParams(window.location.search).has("error");
  const needsLink = reset && (!session || redirectError);
  return (
    <main className="simple-auth">
      <Brand />
      <div className="auth-form-wrap">
        <h1>
          {needsLink
            ? "Request a new reset link."
            : reset
              ? "A fresh password."
              : "Let’s get you back in."}
        </h1>
        <p>
          {needsLink
            ? "Open the latest password reset email, or request another link below."
            : reset
              ? "Choose a new password for your account."
              : "We’ll email you a password reset link."}
        </p>
        {needsLink ? (
          <Link className="button full" to="/forgot-password">
            Request reset email
          </Link>
        ) : (
          <form onSubmit={submit}>
            {reset ? (
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>
            ) : (
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
            )}
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="alert success" role="status">
                {message}
              </p>
            )}
            <button className="button full" disabled={busy}>
              {busy
                ? "Please wait…"
                : reset
                  ? "Update password"
                  : "Send reset link"}
            </button>
          </form>
        )}
        <Link className="back-link" to={reset && session ? "/app" : "/login"}>
          {reset && session ? "Open workspace" : "Back to sign in"} →
        </Link>
      </div>
    </main>
  );
}
