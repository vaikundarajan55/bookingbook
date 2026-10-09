import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';
import { adminLogin } from '../store/adminAuthSlice.js';

/** Template-style two-panel login: teal gradient brand panel + white form panel. */
export default function AdminLogin() {
  const dispatch = useDispatch();
  const { token, user, status, error } = useSelector((s) => s.adminAuth);
  const [form, setForm] = useState({ email: import.meta.env.DEV ? 'admin@hotel.com' : '', password: '' });

  useEffect(() => { document.title = 'Admin login · Harbourline'; }, []);
  if (token && user?.role === 'admin') return <Navigate to="/admin" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex w-full max-w-[450px] overflow-hidden rounded-md bg-white shadow-[0_0_10px_rgba(0,0,0,.1)] md:min-h-[500px] md:max-w-[800px]">
        <div className="hidden w-1/2 flex-col items-center justify-center gap-4 bg-[linear-gradient(135deg,#009688_0%,#06c6b4_52%,#009688_100%)] p-12 text-white md:flex">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15"><Building2 size={44} aria-hidden="true" /></span>
          <p className="text-3xl font-semibold tracking-wide">Harbourline</p>
          <p className="text-center text-sm text-white/85">Hotel administration</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); dispatch(adminLogin(form)); }} className="flex w-full flex-col justify-center p-[1.875rem] md:w-1/2 md:p-[50px]" noValidate>
          <h1 className="text-center text-[22px] font-medium text-[#333] md:text-[26px]">Login</h1>
          <p className="mb-6 text-center text-ink/60">Access to our dashboard</p>
          <div className="space-y-4">
            <div><label className="sr-only" htmlFor="a-email">Email</label><input id="a-email" type="email" placeholder="Email" className="field" autoComplete="username" value={form.email} onChange={set('email')} required /></div>
            <div><label className="sr-only" htmlFor="a-pass">Password</label><input id="a-pass" type="password" placeholder="Password" className="field" autoComplete="current-password" value={form.password} onChange={set('password')} required /></div>
            {error && <p className="rounded bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{error}</p>}
            <button className="btn-primary w-full" disabled={status === 'loading'}>{status === 'loading' && <Spinner />} Login</button>
          </div>
          <a href="/" className="mt-8 text-center text-sm text-[#a0a0a0] hover:text-[#333] hover:underline">Back to the website</a>
        </form>
      </motion.div>
    </div>
  );
}
