import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Spinner from '../../../components/ui/Spinner.jsx';
import { updateProfile } from '../../store/authSlice.js';

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.webAuth.user);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const dirty = form.name !== (user?.name ?? '') || form.phone !== (user?.phone ?? '');

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError('Enter your full name');
    setError('');
    setSaving(true);
    const result = await dispatch(updateProfile({ name: form.name.trim(), phone: form.phone.trim() }));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) toast.success('Profile saved');
    else setError(result.payload);
    return undefined;
  };

  return (
    <div className="max-w-xl space-y-6">
      <div><h1 className="text-3xl font-semibold text-ocean">Profile</h1><p className="mt-1 text-ink/60">These details appear on your bookings and invoices.</p></div>
      <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
        <div><label className="label" htmlFor="pf-name">Full name</label><input id="pf-name" autoComplete="name" className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div>
          <label className="label" htmlFor="pf-email">Email</label>
          <input id="pf-email" type="email" className="field cursor-not-allowed bg-mist" value={user?.email ?? ''} readOnly aria-describedby="pf-email-hint" />
          <p id="pf-email-hint" className="mt-1 text-xs text-ink/55">Your email is your sign-in name. Contact us to change it.</p>
        </div>
        <div><label className="label" htmlFor="pf-phone">Phone</label><input id="pf-phone" type="tel" autoComplete="tel" className="field" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
        {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving || !dirty}>{saving && <Spinner />} Save changes</button>
      </form>
    </div>
  );
}
