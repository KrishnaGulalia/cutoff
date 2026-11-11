import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { SquaresFour, BookOpen, ClockCounterClockwise, UserCircle, SignOut } from '@phosphor-icons/react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Brand';
const links = [['/app', 'Overview', SquaresFour], ['/app/papers', 'Practice papers', BookOpen], ['/app/history', 'My attempts', ClockCounterClockwise], ['/app/profile', 'Account', UserCircle]];
export function AppLayout() {
  const { signOut } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState('');
  async function logout() { try { await signOut(); navigate('/'); } catch (error) { setError(error.message); } }
  return <div className="app-layout"><aside className="sidebar"><Brand to="/app"/><p className="sidebar-caption">YOUR PRACTICE SPACE</p>
    <nav aria-label="Main navigation">{links.map(([to, label, Icon]) => <NavLink end={to === '/app'} key={to} to={to}><Icon size={21}/>{label}</NavLink>)}</nav>
    <div className="sidebar-bottom"><div className="study-note"><span>One paper at a time.</span><p>Notice the gaps.<br/>Make the next attempt count.</p></div>
    <button className="logout" onClick={logout}><SignOut size={20}/>Sign out</button>{error && <p role="alert">{error}</p>}</div>
    </aside><main className="workspace" id="main-content"><Outlet/></main></div>;
}
