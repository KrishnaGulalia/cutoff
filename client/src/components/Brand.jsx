import { Link } from "react-router-dom";
export function Brand({ to = "/" }) {
  return (
    <Link className="brand" to={to} aria-label="Cutoff home">
      <img
        className="brand-mark"
        src="/favicon.svg"
        width="36"
        height="36"
        alt=""
      />
      <span>Cutoff</span>
    </Link>
  );
}
