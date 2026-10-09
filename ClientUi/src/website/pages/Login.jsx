import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthShell from '../components/AuthShell.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { clearAuthError, loginUser } from '../store/authSlice.js';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, token } = useSelector((s) => s.webAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const redirectTo = location.state?.from || '/account';

  useEffect(() => { dispatch(clearAuthError()); }, [dispatch]);
  useEffect(() => { if (token) navigate(redirectTo, { replace: true }); }, [token, navigate, redirectTo]);

  const submit = (e) => { e.preventDefault(); dispatch(loginUser(form)); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see and manage your bookings."
      footer={<>New here? <Link to="/register" state={location.state} className="font-semibold text-ocean-500 hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" className="field" value={form.email} onChange={set('email')} required /></div>
        <div>
          <div className="flex items-center justify-between"><label className="label" htmlFor="password">Password</label><Link to="/forgot-password" className="mb-1.5 text-sm font-semibold text-ocean-500 hover:underline">Forgot password?</Link></div><input id="password" type="password" autoComplete="current-password" className="field" value={form.password} onChange={set('password')} required />
        </div>
        {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={status === 'loading'}>{status === 'loading' && <Spinner />} Sign in</button>
      </form>
    </AuthShell>
  );
}
