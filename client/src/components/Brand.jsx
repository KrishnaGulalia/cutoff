import { Link } from 'react-router-dom';
export function Brand({ to = '/' }) {
  return <Link className="brand" to={to} aria-label="Cutoff home"><span className="brand-mark" aria-hidden="true">c/</span><span>cutoff<span className="brand-period">.</span></span></Link>;
}
