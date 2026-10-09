import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';
import usePublicHotels from '../hooks/usePublicHotels.js';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function Feedback() {
  const hotels = usePublicHotels();
  const [form, setForm] = useState({ hotel_id: '', rating: 0, comment: '' });
  const [hover, setHover] = useState(0);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return setError('Choose a star rating');
    if (form.comment.trim().length < 5) return setError('Tell us a little more (at least 5 characters)');
    setError('');
    setSending(true);
    try {
      await webApi.post('/feedback', { rating: form.rating, comment: form.comment, hotel_id: form.hotel_id ? Number(form.hotel_id) : undefined });
      setSent(true);
      setForm({ hotel_id: '', rating: 0, comment: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
    return undefined;
  };

  const shown = hover || form.rating;

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-wider text-brass-600">Feedback</p>
      <h1 className="mt-2 text-4xl font-semibold text-ocean">How was your stay?</h1>
      <p className="mt-3 text-ink/70">Your feedback goes straight to the hotel team.</p>

      <div className="card mt-8 p-6 sm:p-8">
        {sent ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-8 text-center" role="status">
            <CheckCircle2 size={44} className="mx-auto text-moss" />
            <h2 className="mt-4 text-2xl font-semibold text-ocean">Thank you!</h2>
            <p className="mt-2 text-ink/70">We read every review and use it to improve.</p>
            <button className="btn-ghost mt-6" onClick={() => setSent(false)}>Leave more feedback</button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <div><label className="label" htmlFor="fb-hotel">Hotel</label>
              <select id="fb-hotel" className="field" value={form.hotel_id} onChange={(e) => setForm((f) => ({ ...f, hotel_id: e.target.value }))}>
                <option value="">General feedback</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
              </select></div>

            <fieldset>
              <legend className="label">Your rating</legend>
              <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
                    <input type="radio" name="fb-rating" value={n} className="peer sr-only" checked={form.rating === n} onChange={() => setForm((f) => ({ ...f, rating: n }))} />
                    <Star size={32} aria-hidden="true" className={`rounded transition peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500 ${n <= shown ? 'fill-brass text-brass' : 'text-ink/20'}`} />
                    <span className="sr-only">{n} star{n > 1 ? 's' : ''} ({LABELS[n]})</span>
                  </label>
                ))}
                <span className="ml-3 text-sm font-semibold text-ocean" aria-hidden="true">{LABELS[shown]}</span>
              </div>
            </fieldset>

            <div><label className="label" htmlFor="fb-comment">Comments</label>
              <textarea id="fb-comment" rows={5} maxLength={2000} className="field" placeholder="What did you enjoy? What could we do better?" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} /></div>

            {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={sending}>{sending && <Spinner />} Send feedback</button>
          </form>
        )}
      </div>
    </div>
  );
}
