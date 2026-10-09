import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { CalendarX2, CreditCard, FileText } from 'lucide-react';
import Modal from '../../../components/ui/Modal.jsx';
import StatusBadge from '../../../components/ui/StatusBadge.jsx';
import PaymentBadge from '../../../components/ui/PaymentBadge.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import AcBadge from '../../../components/ui/AcBadge.jsx';
import { cancelBooking, fetchMyBookings } from '../../store/bookingSlice.js';
import { formatDate, formatMoney, nightsBetween, todayISO } from '../../../core/format.js';

const TABS = [['all', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']];

const inTab = (b, tab, today) => {
  if (tab === 'cancelled') return b.status === 'cancelled';
  if (tab === 'upcoming') return b.status !== 'cancelled' && b.status !== 'checked_out' && b.check_out >= today;
  if (tab === 'past') return b.status === 'checked_out' || (b.status !== 'cancelled' && b.check_out < today);
  return true;
};

export default function AccountBookings() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.webBookings);
  const [tab, setTab] = useState('all');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { dispatch(fetchMyBookings()); }, [dispatch]);

  const doCancel = async () => {
    setBusy(true);
    const result = await dispatch(cancelBooking(target.id));
    setBusy(false);
    if (cancelBooking.fulfilled.match(result)) toast.success(`Booking ${target.reference} cancelled`);
    else toast.error(result.payload);
    setTarget(null);
  };

  const today = todayISO();
  const shown = items.filter((b) => inTab(b, tab, today));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-ocean">My bookings</h1>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-moss"><span className="h-2 w-2 animate-pulse-dot rounded-full bg-moss" /> Updates appear live</span>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map(([value, label]) => (
          <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === value ? 'bg-ocean text-white' : 'bg-white text-ocean ring-1 ring-ocean/10 hover:bg-ocean-100'}`}>{label}</button>
        ))}
      </div>

      <div className="space-y-4">
        {status === 'loading' && !items.length && [0, 1].map((i) => <div key={i} className="skeleton h-40" />)}
        {status !== 'loading' && shown.length === 0 && (
          <EmptyState icon={CalendarX2} title={items.length ? 'Nothing here' : 'No bookings yet'} text={items.length ? 'Try another tab.' : 'When you book a room it shows up here.'}
            action={<Link to="/rooms" className="btn-primary">Browse rooms</Link>} />
        )}
        {shown.map((b) => {
          const unpaid = b.status !== 'cancelled' && b.payment_status !== 'paid';
          return (
            <article key={b.id} className="card flex flex-col overflow-hidden sm:flex-row">
              {b.room_image && <img src={b.room_image} alt="" className="h-40 w-full object-cover sm:h-auto sm:w-48" loading="lazy" />}
              <div className="flex-1 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-ocean-500">{b.hotel_name}</p>
                    <h2 className="text-xl font-semibold text-ocean">{b.room_name}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2"><StatusBadge status={b.status} />{b.status !== 'cancelled' && <PaymentBadge status={b.payment_status} />}</div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/55">Ref. {b.reference} <AcBadge isAc={b.room_is_ac} /></div>
                <p className="mt-3 text-sm font-medium text-ink/75">
                  {formatDate(b.check_in)} → {formatDate(b.check_out)} · {nightsBetween(b.check_in, b.check_out)} nights · {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-xl font-bold text-ocean">{formatMoney(b.total_price)}</p>
                  <div className="flex flex-wrap gap-2">
                    {unpaid && <Link to={`/payment?bookings=${b.id}`} className="btn-brass !px-3 !py-2 !text-xs"><CreditCard size={14} /> Pay now</Link>}
                    {b.status !== 'cancelled' && <Link to={`/account/bookings/${b.id}/invoice`} className="btn-ghost !px-3 !py-2 !text-xs"><FileText size={14} /> Invoice</Link>}
                    {['pending', 'confirmed'].includes(b.status) && <button className="btn-ghost !px-3 !py-2 !text-xs !text-coral" onClick={() => setTarget(b)}>Cancel</button>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal open={Boolean(target)} onClose={() => !busy && setTarget(null)} title="Cancel this booking?" size="sm"
        footer={<>
          <button className="btn-ghost" onClick={() => setTarget(null)} disabled={busy}>Keep booking</button>
          <button className="btn-danger" onClick={doCancel} disabled={busy}>{busy && <Spinner />} Cancel booking</button>
        </>}>
        <p className="text-sm text-ink/70">
          {target && `${target.room_name}, ${formatDate(target.check_in)} to ${formatDate(target.check_out)}. The room will be released for other guests.`}
          {target?.payment_status === 'paid' && ' This booking is paid: the hotel will contact you about your refund.'}
        </p>
      </Modal>
    </div>
  );
}
