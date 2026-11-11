import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { supabase } from '../lib/supabase';
export function AuthPage({ mode = 'login' }) {
  const signup = mode === 'signup'; const navigate = useNavigate();
  const [error,setError] = useState(''); const [notice,setNotice] = useState(''); const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    if (!supabase) { setError('Sign-in is not available yet. Please try again later.'); setBusy(false); return; }
    const form = new FormData(event.currentTarget);
    try {
      const credentials = { email: form.get('email').trim(), password: form.get('password') };
      const result = signup ? await supabase.auth.signUp({ ...credentials, options: { data: { name: form.get('name').trim() }, emailRedirectTo: window.location.origin + '/app' } }) : await supabase.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (result.data.session) navigate('/app');
      else setNotice('Check your inbox to confirm your email, then sign in.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <div className="auth-layout"><aside className="auth-story"><Brand/><div><span className="edition">MAKE PRACTICE COUNT</span><h1>A little more<br/>clarity.<br/><em>Every attempt.</em></h1><p>Your papers, your progress, your next step.</p></div><span className="auth-foot">Physics / Chemistry / Mathematics</span></aside>
    <main className="auth-main"><Link className="back-link" to="/">← Back to Cutoff</Link><div className="auth-form-wrap"><span className="section-label">{signup ? 'YOUR STARTING POINT' : 'PICK UP WHERE YOU LEFT OFF'}</span><h2>{signup ? 'Make room for progress.' : 'Welcome back.'}</h2><p>{signup ? 'Create your free practice account.' : 'Your next good attempt is waiting.'}</p>
    <form onSubmit={submit}>{signup && <label>Your name<input name="name" autoComplete="name" required maxLength={80} placeholder="What should we call you?"/></label>}
    <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label>
    <label>Password<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} placeholder={signup ? 'At least 8 characters' : 'Your password'}/></label>
    {!signup && <Link className="form-link" to="/forgot-password">Forgot password?</Link>}
    {error && <p className="alert error" role="alert">{error}</p>}{notice && <p className="alert success" role="status">{notice}</p>}
    <button className="button full" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account ↗' : 'Sign in ↗'}</button></form>
    <p className="auth-switch">{signup ? 'Already have an account?' : 'New here?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link></p></div></main></div>;
}
