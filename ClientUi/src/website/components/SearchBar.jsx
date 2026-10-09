import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search, Users } from 'lucide-react';
import { nightsBetween, todayISO } from '../../core/format.js';

export default function SearchBar({ initial = {}, className = '' }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    checkIn: initial.checkIn || todayISO(1),
    checkOut: initial.checkOut || todayISO(3),
    guests: initial.guests || 2,
  });
  const [error, setError] = useState('');

  const set = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    if (key === 'checkIn' && nightsBetween(next.checkIn, next.checkOut) < 1) {
      const d = new Date(next.checkIn); d.setDate(d.getDate() + 1);
      next.checkOut = d.toISOString().slice(0, 10);
    }
    setForm(next);
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (nightsBetween(form.checkIn, form.checkOut) < 1) return setError('Check-out must be after check-in');
    return navigate(`/rooms?${new URLSearchParams(form).toString()}`);
  };

  return (
    <form onSubmit={submit} className={`rounded-2xl bg-white p-3 shadow-glass ${className}`} aria-label="Search available rooms">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_.7fr_auto]">
        <label className="flex items-center gap-3 rounded-xl bg-mist px-4 py-2.5">
          <CalendarDays size={18} className="shrink-0 text-ocean-500" />
          <span className="flex-1">
            <span className="block text-xs font-semibold text-ink/50">Check-in</span>
            <input type="date" min={todayISO()} value={form.checkIn} onChange={set('checkIn')} className="w-full bg-transparent text-sm font-semibold text-ocean focus:outline-none" required />
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-xl bg-mist px-4 py-2.5">
          <CalendarDays size={18} className="shrink-0 text-ocean-500" />
          <span className="flex-1">
            <span className="block text-xs font-semibold text-ink/50">Check-out</span>
            <input type="date" min={form.checkIn} value={form.checkOut} onChange={set('checkOut')} className="w-full bg-transparent text-sm font-semibold text-ocean focus:outline-none" required />
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-xl bg-mist px-4 py-2.5">
          <Users size={18} className="shrink-0 text-ocean-500" />
          <span className="flex-1">
            <span className="block text-xs font-semibold text-ink/50">Guests</span>
            <select value={form.guests} onChange={set('guests')} className="w-full bg-transparent text-sm font-semibold text-ocean focus:outline-none">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </span>
        </label>
        <button type="submit" className="btn-brass px-6"><Search size={16} /> Find rooms</button>
      </div>
      {error && <p className="px-2 pt-2 text-sm font-medium text-coral" role="alert">{error}</p>}
    </form>
  );
}
