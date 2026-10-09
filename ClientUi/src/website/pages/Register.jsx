import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthShell from '../components/AuthShell.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { clearAuthError, registerUser } from '../store/authSlice.js';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, token } = useSelector((s) => s.webAuth);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => { dispatch(clearAuthError()); }, [dispatch]);
  const redirectTo = location.state?.from || '/account';
  useEffect(() => { if (token) navigate(redirectTo, { replace: true }); }, [token, navigate, redirectTo]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setLocalError('Use at least 8 characters for your password');
    setLocalError('');
    return dispatch(registerUser(form));
  };

  return (
    <AuthShell title="Create your account" subtitle="One account for every stay at Harbourline."
      footer={<>Already registered? <Link to="/login" state={location.state} className="font-semibold text-ocean-500 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="name">Full name</label><input id="name" autoComplete="name" className="field" value={form.name} onChange={set('name')} required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" className="field" value={form.email} onChange={set('email')} required /></div>
          <div><label className="label" htmlFor="phone">Phone (optional)</label><input id="phone" type="tel" autoComplete="tel" className="field" value={form.phone} onChange={set('phone')} /></div>
        </div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" className="field" value={form.password} onChange={set('password')} required aria-describedby="pw-hint" /><p id="pw-hint" className="mt-1 text-xs text-ink/55">At least 8 characters.</p></div>
        {(localError || error) && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{localError || error}</p>}
        <button className="btn-primary w-full" disabled={status === 'loading'}>{status === 'loading' && <Spinner />} Create account</button>
      </form>
    </AuthShell>
  );
}
