import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useResource } from '../hooks/useResource';
import { Loading, ErrorState } from '../components/States';
export function DashboardPage() {
  const profile = useResource('/me'); const history = useResource('/attempts');
  if (profile.loading || history.loading) return <Loading/>;
  if (profile.error || history.error) return <ErrorState message={profile.error || history.error} retry={() => { profile.reload(); history.reload(); }}/>;
  const attempts = history.data; const completed = attempts.filter(item => item.attempt_status === 'SUBMITTED'); const active = attempts.filter(item => item.attempt_status === 'IN_PROGRESS');
  return <><header className="page-heading"><span className="section-label">YOUR OVERVIEW</span><h1>Good to see you,<br/><span>{profile.data.user_name.split(' ')[0]}.</span></h1><p>Let’s give today’s practice a little direction.</p></header>
    <section className="dashboard-banner"><div><span className="section-label">THE NEXT STEP</span><h2>{active.length ? 'You have unfinished business.' : 'A fresh paper. A fresh perspective.'}</h2><p>{active.length ? 'Your answers are saved. Pick up your active attempt.' : 'Choose a paper, find your rhythm, and see where you stand.'}</p>
    <Link className="button lime" to={active.length ? '/app/attempts/'+active[0].attempt_id : '/app/papers'}>{active.length ? 'Resume practice' : 'Explore practice papers'}<ArrowUpRight size={20}/></Link></div><span className="banner-symbol" aria-hidden="true">↗</span></section>
    <section className="stat-strip" aria-label="Recent practice totals"><div><span>{completed.length}</span><p>Completed attempts</p></div><div><span>{active.length}</span><p>In progress</p></div><div><span>{new Set(attempts.map(item => item.test_id)).size}</span><p>Different papers tried</p></div></section>
    <section className="recent-section"><div className="section-heading"><h2>Recently on your desk</h2><Link to="/app/history">All attempts ↗</Link></div>{!attempts.length ? <div className="first-step"><span>01</span><div><h3>Start with one paper.</h3><p>Your practice history will take shape here.</p></div><Link to="/app/papers">Find a paper →</Link></div> : attempts.slice(0,4).map(item => <Link className="attempt-row" key={item.attempt_id} to={'/app/attempts/'+item.attempt_id+(item.attempt_status === 'SUBMITTED' ? '/results' : '')}><div><h3>{item.test_title}</h3><p>{new Date(item.started_at).toLocaleDateString()}</p></div><span className={'badge '+(item.attempt_status === 'SUBMITTED' ? 'complete' : '')}>{item.attempt_status === 'SUBMITTED' ? 'View results ↗' : 'Resume →'}</span></Link>)}</section></>;
}
