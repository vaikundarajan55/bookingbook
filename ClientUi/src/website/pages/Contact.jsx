import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Mail, Send } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';
import usePublicHotels from '../hooks/usePublicHotels.js';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export default function Contact() {
  const user = useSelector((s) => s.webAuth.user);
  const hotels = usePublicHotels();
  const blank = { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', hotel_id: '', subject: '', message: '' };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError('Tell us your name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email so we can reply');
    if (form.subject.trim().length < 3) return setError('Add a short subject');
    if (form.message.trim().length < 10) return setError('Your message needs at least 10 characters');
    setError('');
    setSending(true);
    try {
      const { data } = await webApi.post('/enquiries', { ...form, hotel_id: form.hotel_id ? Number(form.hotel_id) : undefined });
      setSent(data.message);
      setForm(blank);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
    return undefined;
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-brass-600">Contact us</p>
        <h1 className="mt-2 text-4xl font-semibold text-ocean">Questions before you book?</h1>
        <p className="mt-4 max-w-md leading-relaxed text-ink/70">Group stays, special requests, events or anything else: send us a message and the front desk will reply by email.</p>
        <ul className="mt-8 space-y-4 text-sm text-ink/70">
          <li className="flex items-center gap-3"><Mail size={18} className="text-ocean-500" /> stay@harbourline.example</li>
          <li className="flex items-center gap-3"><Clock size={18} className="text-ocean-500" /> We usually reply within a day</li>
        </ul>
      </div>

      <div className="card p-6 sm:p-8">
        {sent ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center" role="status">
            <CheckCircle2 size={44} className="mx-auto text-moss" />
            <h2 className="mt-4 text-2xl font-semibold text-ocean">Message sent</h2>
            <p className="mt-2 text-ink/70">{sent}</p>
            <button className="btn-ghost mt-6" onClick={() => setSent('')}>Send another message</button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            <div><label className="label" htmlFor="ct-name">Your name</label><input id="ct-name" autoComplete="name" className="field" value={form.name} onChange={set('name')} /></div>
            <div><label className="label" htmlFor="ct-email">Email</label><input id="ct-email" type="email" autoComplete="email" className="field" value={form.email} onChange={set('email')} /></div>
            <div><label className="label" htmlFor="ct-phone">Phone (optional)</label><input id="ct-phone" type="tel" autoComplete="tel" className="field" value={form.phone} onChange={set('phone')} /></div>
            <div><label className="label" htmlFor="ct-hotel">Hotel (optional)</label>
              <select id="ct-hotel" className="field" value={form.hotel_id} onChange={set('hotel_id')}>
                <option value="">Any hotel</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
              </select></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="ct-subject">Subject</label><input id="ct-subject" className="field" maxLength={160} value={form.subject} onChange={set('subject')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="ct-message">Message</label><textarea id="ct-message" rows={5} maxLength={3000} className="field" value={form.message} onChange={set('message')} /></div>
            {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral sm:col-span-2" role="alert">{error}</p>}
            <button type="submit" className="btn-primary sm:col-span-2" disabled={sending}>{sending ? <Spinner /> : <Send size={16} />} Send message</button>
          </form>
        )}
      </div>
    </div>
  );
}
