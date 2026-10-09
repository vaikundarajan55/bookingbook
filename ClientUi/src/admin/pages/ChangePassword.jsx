import { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

const empty = { current: '', next: '', confirm: '' };

export default function ChangePassword() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.current) found.current = 'Enter your current password';
    if (form.next.length < 8) found.next = 'Use at least 8 characters';
    else if (form.next === form.current) found.next = 'Choose a password different from the current one';
    if (form.confirm !== form.next) found.confirm = 'The two new passwords do not match';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await adminApi.put('/auth/change-password', { current_password: form.current, new_password: form.next });
      toast.success('Password changed. Use the new one next time you sign in.');
      setForm(empty);
    } catch (err) {
      const details = err?.response?.data?.details || {};
      setErrors({ current: details.current_password, next: details.new_password });
      if (!details.current_password && !details.new_password) toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (key, id, label, autoComplete) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type="password" className="field" autoComplete={autoComplete} value={form[key]} onChange={set(key)}
        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${id}-err` : undefined} />
      {errors[key] && <p id={`${id}-err`} className="mt-1 text-xs font-medium text-coral">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ocean">Change password</h1>
        <p className="mt-1 text-ink/60">For your admin account. You stay signed in on this device.</p>
      </div>
      <form className="card space-y-4 p-6" onSubmit={submit} noValidate>
        {field('current', 'cp-current', 'Current password', 'current-password')}
        {field('next', 'cp-next', 'New password', 'new-password')}
        {field('confirm', 'cp-confirm', 'Confirm new password', 'new-password')}
        <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? <Spinner /> : <KeyRound size={16} />} Update password</button>
      </form>
    </div>
  );
}
