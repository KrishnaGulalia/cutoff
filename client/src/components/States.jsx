import { Link } from 'react-router-dom';
export function Loading({ text = 'Loading your workspace…' }) {
  return <div className="state" role="status"><span className="spinner"/><p>{text}</p></div>;
}
export function ErrorState({ message, retry }) {
  return <div className="state error-state" role="alert"><h2>Let’s try that again.</h2><p>{message}</p>{retry && <button className="button secondary" onClick={retry}>Retry</button>}</div>;
}
export function EmptyState({ title, description, to, action }) {
  return <div className="state empty-state"><span className="empty-mark" aria-hidden="true">↗</span><h2>{title}</h2><p>{description}</p>{to && <Link className="button" to={to}>{action}</Link>}</div>;
}
