import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CalendarCheck2, CalendarDays, Clock, MapPin, Wallet } from 'lucide-react';
import KpiCard, { kpiItem } from '../../../components/ui/KpiCard.jsx';
import StatusBadge from '../../../components/ui/StatusBadge.jsx';
import PaymentBadge from '../../../components/ui/PaymentBadge.jsx';
import AcBadge from '../../../components/ui/AcBadge.jsx';
import { fetchMyBookings } from '../../store/bookingSlice.js';
import { formatDate, formatMoney, nightsBetween, todayISO } from '../../../core/format.js';

const ACTIVE = ['pending', 'confirmed', 'checked_in'];
// Website palette accents (same hues as the site's ocean / moss / brass / coral tokens)
const ACCENT = { ocean: '#1F7A8C', moss: '#2F8F6B', brass: '#A98630', coral: '#D1495B' };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const daysUntil = (iso) => Math.round((new Date(`${iso}T00:00:00`) - new Date(`${todayISO()}T00:00:00`)) / 86_400_000);

export default function AccountDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.webAuth.user);
  const { items, status } = useSelector((s) => s.webBookings);
  useEffect(() => { dispatch(fetchMyBookings()); }, [dispatch]);

  const today = todayISO();
  const upcoming = items.filter((b) => ACTIVE.includes(b.status) && b.check_out >= today).sort((a, b) => a.check_in.localeCompare(b.check_in));
  const next = upcoming[0];
  const paid = items.filter((b) => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_price), 0);
  const unpaid = items.filter((b) => b.status !== 'cancelled' && b.payment_status !== 'paid');
  const due = unpaid.reduce((sum, b) => sum + Number(b.total_price), 0);
  const nightsStayed = items.filter((b) => b.status === 'checked_out').reduce((sum, b) => sum + nightsBetween(b.check_in, b.check_out), 0);
  const inDays = next ? daysUntil(next.check_in) : null;

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={kpiItem}>
        <h1 className="text-3xl font-semibold text-ocean">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-ink/60">Your stays, payments and invoices in one place.</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CalendarDays} label="Upcoming stays" value={upcoming.length} accent={ACCENT.ocean} caption={next ? `Next on ${formatDate(next.check_in, { day: 'numeric', month: 'short' })}` : 'Nothing booked yet'} />
        <KpiCard icon={CalendarCheck2} label="Total bookings" value={items.length} accent={ACCENT.brass} caption={`${nightsStayed} night${nightsStayed === 1 ? '' : 's'} stayed with us`} />
        <KpiCard icon={Wallet} label="Paid" value={paid} format={(n) => formatMoney(n)} accent={ACCENT.moss} caption="Across all bookings" />
        <KpiCard icon={AlertCircle} label="Due" value={due} format={(n) => formatMoney(n)} accent={due ? ACCENT.coral : ACCENT.moss} caption={due ? `${unpaid.length} booking${unpaid.length > 1 ? 's' : ''} to pay` : 'All settled'} />
      </div>

      {unpaid.length > 0 && (
        <motion.div variants={kpiItem} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brass-100 p-4">
          <p className="text-sm font-semibold text-ink/80">{unpaid.length} booking{unpaid.length > 1 ? 's are' : ' is'} waiting for payment ({formatMoney(due)}).</p>
          <Link to={`/payment?bookings=${unpaid.map((b) => b.id).join(',')}`} className="btn-brass !py-2">Pay now</Link>
        </motion.div>
      )}

      <motion.section variants={kpiItem} className="card overflow-hidden">
        {status === 'loading' && !items.length ? <div className="skeleton m-6 h-40" /> : next ? (
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="relative min-h-[220px] bg-ocean-100">
              {next.room_image && <motion.img src={next.room_image} alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 via-ocean-950/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Next stay</p>
                <p className="font-display text-2xl font-semibold">{next.room_name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-ocean text-white">
                  <span className="font-display text-2xl font-bold leading-none">{Math.max(inDays, 0)}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{inDays === 1 ? 'day' : 'days'}</span>
                </div>
                <p className="text-sm text-ink/70">{inDays > 0 ? `Until check-in on ${formatDate(next.check_in)}` : inDays === 0 ? 'Check-in is today. Welcome!' : `You’re staying with us until ${formatDate(next.check_out)}`}</p>
              </div>
              <div className="flex flex-wrap gap-2"><StatusBadge status={next.status} /><PaymentBadge status={next.payment_status} /><AcBadge isAc={next.room_is_ac} /></div>
              <ul className="space-y-1.5 text-sm text-ink/75">
                <li className="flex items-center gap-2"><MapPin size={15} className="text-ocean-500" aria-hidden="true" />{next.hotel_name}{next.hotel_city ? `, ${next.hotel_city}` : ''}</li>
                <li className="flex items-center gap-2"><Clock size={15} className="text-ocean-500" aria-hidden="true" />{formatDate(next.check_in)} → {formatDate(next.check_out)} · {nightsBetween(next.check_in, next.check_out)} nights · {next.guests} guests</li>
              </ul>
              <div className="mt-auto flex flex-wrap gap-2">
                {next.payment_status !== 'paid' && <Link to={`/payment?bookings=${next.id}`} className="btn-brass !py-2">Pay now</Link>}
                <Link to={`/account/bookings/${next.id}/invoice`} className="btn-ghost !py-2">Invoice</Link>
                <Link to="/account/bookings" className="btn-ghost !py-2">Manage <ArrowRight size={14} /></Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="font-display text-2xl font-semibold text-ocean">No upcoming stays</p>
            <p className="mt-1 text-sm text-ink/60">Your next trip is a few clicks away.</p>
            <Link to="/rooms" className="btn-primary mt-4">Find a room</Link>
          </div>
        )}
      </motion.section>

      <motion.section variants={kpiItem} className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ocean/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-ocean">Recent bookings</h2>
          <Link to="/account/bookings" className="text-sm font-semibold text-ocean-500 hover:underline">See all</Link>
        </div>
        <ul className="divide-y divide-ocean/10">
          {items.slice(0, 5).map((b, i) => (
            <motion.li key={b.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.06 }}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
              <span className="flex items-center gap-3">
                {b.room_image && <img src={b.room_image} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />}
                <span><span className="block font-semibold text-ocean">{b.room_name}</span><span className="text-ink/55">{b.reference} · {formatDate(b.check_in)}</span></span>
              </span>
              <span className="flex items-center gap-2"><span className="font-semibold tabular-nums">{formatMoney(b.total_price)}</span><StatusBadge status={b.status} /></span>
            </motion.li>
          ))}
          {!items.length && status !== 'loading' && <li className="px-6 py-6 text-sm text-ink/60">You haven’t booked yet.</li>}
        </ul>
      </motion.section>
    </motion.div>
  );
}
