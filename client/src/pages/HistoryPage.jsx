import { Link } from 'react-router-dom';
import { useResource } from '../hooks/useResource';
import { Loading, ErrorState, EmptyState } from '../components/States';
export function HistoryPage() {
  const history = useResource('/attempts');
  return <><header className="page-heading"><span className="section-label">THE WORK YOU’VE PUT IN</span><h1>Your attempt<br/><span>archive.</span></h1><p>Every attempt stays separate. Every return is a new start.</p></header>{history.loading ? <Loading/> : history.error ? <ErrorState message={history.error} retry={history.reload}/> : !history.data.length ? <EmptyState title="Your first page is still blank." description="Start a practice paper and your attempts will appear here." to="/app/papers" action="Explore papers"/> : <div className="history-list">{history.data.map(item => <Link className="attempt-row" key={item.attempt_id} to={'/app/attempts/'+item.attempt_id+(item.attempt_status === 'SUBMITTED' ? '/results' : '')}><div><span className="muted">ATTEMPT #{item.attempt_id}</span><h2>{item.test_title}</h2><p>{new Date(item.started_at).toLocaleString()}{item.is_demo ? ' · Original demo' : ''}</p></div><span className={'badge '+(item.attempt_status === 'SUBMITTED' ? 'complete' : '')}>{item.attempt_status === 'SUBMITTED' ? 'View results ↗' : 'Resume →'}</span></Link>)}</div>}</>;
}
