import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError('Use at least 8 characters');
    if (form.password !== form.confirm) return setError('The two passwords do not match');
    setError('');
    setSaving(true);
    try {
      const { data } = await webApi.post('/auth/reset-password', { token, password: form.password });
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  if (!token) {
    return (
      <AuthShell title="Link missing" subtitle="Open the reset link from your email, or request a new one."
        footer={<Link to="/forgot-password" className="font-semibold text-ocean-500 hover:underline">Request a new link</Link>}>
        <span />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you haven’t used here before."
      footer={<>Link expired? <Link to="/forgot-password" className="font-semibold text-ocean-500 hover:underline">Request a new one</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="rp-new">New password</label><input id="rp-new" type="password" autoComplete="new-password" className="field" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
        <div><label className="label" htmlFor="rp-confirm">Confirm new password</label><input id="rp-confirm" type="password" autoComplete="new-password" className="field" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} /></div>
        <p className="text-xs text-ink/55">At least 8 characters.</p>
        {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={saving}>{saving && <Spinner />} Update password</button>
      </form>
    </AuthShell>
  );
}
