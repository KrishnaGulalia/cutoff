import { useState } from "react";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { Loading, ErrorState } from "../components/States";
import { Link } from "react-router-dom";
export function ProfilePage() {
  const profile = useResource("/me");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await api("/me", {
        method: "PATCH",
        body: { name: new FormData(event.currentTarget).get("name") },
      });
      setMessage("Your name has been updated.");
      profile.reload();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (profile.loading) return <Loading />;
  if (profile.error)
    return <ErrorState message={profile.error} retry={profile.reload} />;
  return (
    <>
      <header className="page-heading">
        <h1>Account</h1>
      </header>
      <section className="profile-panel">
        <form onSubmit={save}>
          <label>
            Name
            <input
              name="name"
              defaultValue={profile.data.user_name}
              required
              maxLength={80}
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input value={profile.data.email} readOnly type="email" />
          </label>
          <p className="muted">
            Your email is managed by your sign-in account.
          </p>
          {message && (
            <p className="alert success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
        <Link className="back-link" to="/forgot-password">
          Reset your password →
        </Link>
      </section>
    </>
  );
}
