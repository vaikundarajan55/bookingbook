import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';
import CheckoutSteps from '../components/CheckoutSteps.jsx';
import { checkoutCart, lineTotal } from '../store/cartSlice.js';
import { formatDate, formatMoney, nightsBetween, todayISO } from '../../core/format.js';

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, submitting } = useSelector((s) => s.webCart);
  const user = useSelector((s) => s.webAuth.user);
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  if (!items.length) return <Navigate to="/cart" replace />;
  const total = items.reduce((sum, i) => sum + lineTotal(i), 0);
  const expired = items.some((i) => i.check_in < todayISO());

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!agreed) return setError('Please accept the booking and cancellation policy');
    setError('');
    const result = await dispatch(checkoutCart({ items, notes }));
    if (checkoutCart.fulfilled.match(result)) {
      toast.success(`${result.payload.length} room${result.payload.length > 1 ? 's' : ''} reserved. Complete the payment to finish.`);
      navigate(`/payment?bookings=${result.payload.map((b) => b.id).join(',')}`, { replace: true });
    } else {
      setError(result.payload);
    }
    return undefined;
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <CheckoutSteps current={1} />
      <h1 className="text-4xl font-semibold text-ocean">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]" noValidate>
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ocean">Guest details</h2>
              <Link to="/account/profile" className="text-sm font-semibold text-ocean-500 hover:underline">Edit profile</Link>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-ink/55">Name</dt><dd className="font-semibold">{user?.name}</dd></div>
              <div><dt className="text-ink/55">Email</dt><dd className="break-all font-semibold">{user?.email}</dd></div>
              <div><dt className="text-ink/55">Phone</dt><dd className="font-semibold">{user?.phone || <Link to="/account/profile" className="text-ocean-500 hover:underline">Add phone</Link>}</dd></div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-ocean">Your stays</h2>
            <ul className="mt-4 divide-y divide-ocean/10">
              {items.map((i) => (
                <li key={i.key} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ocean">{i.room_name} <span className="font-normal text-ink/55">· {i.is_ac ? 'AC' : 'Non-AC'}</span></p>
                    <p className="text-ink/60">{i.hotel_name} · {formatDate(i.check_in)} → {formatDate(i.check_out)} · {nightsBetween(i.check_in, i.check_out)} nights · {i.guests} guests</p>
                  </div>
                  <p className="font-semibold">{formatMoney(lineTotal(i))}</p>
                </li>
              ))}
            </ul>
            <Link to="/cart" className="text-sm font-semibold text-ocean-500 hover:underline">Change cart</Link>
          </section>

          <section className="card p-6">
            <label className="text-xl font-semibold text-ocean" htmlFor="co-notes">Special requests <span className="text-sm font-normal text-ink/50">(optional)</span></label>
            <textarea id="co-notes" rows={3} maxLength={500} className="field mt-3" placeholder="Late arrival, airport pickup, extra pillows…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-ocean">Order total</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink/60">{items.length} room{items.length > 1 ? 's' : ''}</dt><dd>{formatMoney(total)}</dd></div>
              <div className="flex justify-between border-t border-ocean/10 pt-3 text-base"><dt className="font-semibold text-ocean">To pay</dt><dd className="font-display text-2xl font-bold text-ocean">{formatMoney(total)}</dd></div>
            </dl>
            <p className="mt-1 text-right text-xs text-ink/50">Taxes included</p>

            <label className="mt-5 flex items-start gap-3 text-sm text-ink/70">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ocean" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I agree to the booking terms. Free cancellation until 48 hours before check-in.</span>
            </label>
            {expired && <p className="mt-3 text-sm font-semibold text-coral">Some dates in your cart have passed. <Link to="/cart" className="underline">Fix your cart</Link>.</p>}
            {error && <p className="mt-3 rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{error}</p>}
            <button type="submit" className="btn-brass mt-5 w-full" disabled={submitting || expired}>{submitting ? <Spinner /> : <Lock size={16} />} Continue to payment</button>
            <p className="mt-3 text-center text-xs text-ink/50">Your rooms are held as soon as you continue.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
