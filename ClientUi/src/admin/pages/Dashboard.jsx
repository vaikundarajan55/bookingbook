import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BedDouble, CalendarCheck, CircleDollarSign, Inbox, Star, Wallet } from 'lucide-react';
import KpiCard, { kpiItem } from '../../components/ui/KpiCard.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import RoomTypeDonut from '../components/RoomTypeDonut.jsx';
import { BookedVsCollectedChart, HorizontalBars, Meter, SERIES, Sparkline } from '../components/DashboardCharts.jsx';
import { fetchDashboard } from '../store/dashboardSlice.js';
import { changeBookingStatus } from '../store/adminBookingSlice.js';
import { formatDate, formatMoney } from '../../core/format.js';
import useCountUp from '../../core/useCountUp.js';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const pctChange = (now, before) => (before ? ((now - before) / before) * 100 : null);
const money = (n) => formatMoney(n);
const monthName = (key) => (key ? new Date(`${key}-01T00:00:00`).toLocaleString('en-GB', { month: 'short' }) : '');

function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en-US') }) {
  return <>{format(useCountUp(value))}</>;
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { data, status, error } = useSelector((s) => s.dashboard);
  const user = useSelector((s) => s.adminAuth.user);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  const act = async (booking, next) => {
    const result = await dispatch(changeBookingStatus({ id: booking.id, status: next }));
    if (changeBookingStatus.fulfilled.match(result)) { toast.success(`${booking.reference} ${next}`); dispatch(fetchDashboard()); } else toast.error(result.payload);
  };

  if (status === 'loading' && !data) return <PageLoader label="Loading dashboard" />;
  if (!data) return <p className="rounded bg-coral-100 p-4 text-sm font-medium text-coral">{error || 'Dashboard unavailable'}</p>;

  const { series } = data;
  // Trend = last complete month vs the month before it (the current month is still running)
  const last = series[series.length - 2];
  const prev = series[series.length - 3];
  const sum = (key) => series.reduce((s, m) => s + m[key], 0);
  const collectionRate = data.collections + data.outstanding ? (data.collections / (data.collections + data.outstanding)) * 100 : 0;
  const trendLabel = `${monthName(last?.month)} vs ${monthName(prev?.month)}`;

  const statusRows = [
    { label: 'Pending', value: data.counts.pending },
    { label: 'Confirmed', value: data.counts.confirmed },
    { label: 'Checked in', value: data.counts.checked_in },
    { label: 'Checked out', value: data.counts.checked_out },
    { label: 'Cancelled', value: data.counts.cancelled },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={kpiItem} className="mb-[30px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mt-2">{greeting()} {user?.name?.split(' ')[0]}!</h1>
          <p className="text-sm text-ink/60">Dashboard · last 12 months</p>
        </div>
        {data.counts.pending > 0 && <Link to="/admin/bookings" className="btn-primary !py-2 text-sm">{data.counts.pending} waiting for approval</Link>}
      </motion.div>

      {/* KPI row */}
      <div className="grid gap-[30px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CircleDollarSign} label="Revenue booked" value={sum('booked')} format={money} accent={SERIES.booked}
          visual={<Sparkline values={series.map((s) => s.booked)} color={SERIES.booked} />} trend={pctChange(last?.booked, prev?.booked)} trendLabel={trendLabel} />
        <KpiCard icon={Wallet} label="Collected" value={sum('collected')} format={money} accent={SERIES.collected}
          visual={<Sparkline values={series.map((s) => s.collected)} color={SERIES.collected} />} trend={pctChange(last?.collected, prev?.collected)} trendLabel={trendLabel} />
        <KpiCard icon={CalendarCheck} label="Bookings" value={sum('bookings')} accent={SERIES.bookings}
          visual={<Sparkline values={series.map((s) => s.bookings)} color={SERIES.bookings} />} trend={pctChange(last?.bookings, prev?.bookings)} trendLabel={trendLabel} />
        <KpiCard icon={BedDouble} label="Occupied tonight" value={data.occupancyRate} format={(n) => `${Math.round(n)}%`} accent={SERIES.occupancy}
          visual={<Meter value={data.occupancyRate} color={SERIES.occupancy} />} caption={`${data.occupiedToday} of ${data.totalRooms} rooms · ${data.availableRooms} available`} />
      </div>

      {/* Main chart + money summary */}
      <div className="mt-[30px] grid gap-[30px] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <motion.section variants={kpiItem} className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-ink">Booked vs. collected</h2><p className="text-sm text-ink/55">Trailing 12 months</p></div>
            <ul className="flex gap-4 text-sm" aria-label="Legend">
              <li className="flex items-center gap-2 text-ink/75"><span className="h-2.5 w-5 rounded-full" style={{ backgroundColor: SERIES.booked }} />Booked</li>
              <li className="flex items-center gap-2 text-ink/75"><span className="h-2.5 w-5 rounded-full" style={{ backgroundColor: SERIES.collected }} />Collected</li>
            </ul>
          </div>
          <div className="mt-4"><BookedVsCollectedChart series={series} /></div>
        </motion.section>

        <motion.section variants={kpiItem} className="card flex flex-col p-6">
          <h2 className="text-sm text-ink/65">Collection rate</h2>
          <p className="mt-1 text-[2.5rem] font-bold leading-none tracking-tight text-ink tabular-nums"><CountUp value={collectionRate} format={(n) => `${n.toFixed(1)}%`} /></p>
          <p className="mt-1 text-xs text-ink/55">of non-cancelled booking value has been paid</p>
          <dl className="mt-5 divide-y divide-[#eef0f3] border-t border-[#eef0f3] text-sm">
            {[
              ['Collected', data.collections, 'text-ink'],
              ['Outstanding', data.outstanding, 'text-coral'],
              ['Cancelled value', data.cancelledValue, 'text-ink/70'],
              ['Avg. booking value', data.avgBookingValue, 'text-ink'],
            ].map(([label, value, cls]) => (
              <div key={label} className="flex items-center justify-between py-3">
                <dt className="text-ink/70">{label}</dt>
                <dd className={`font-semibold tabular-nums ${cls}`}><CountUp value={value} format={money} /></dd>
              </div>
            ))}
          </dl>
          <Link to="/admin/invoices" className="mt-auto pt-4 text-sm font-semibold text-ocean hover:underline">Open invoices →</Link>
        </motion.section>
      </div>

      {/* Breakdown row */}
      <div className="mt-[30px] grid gap-[30px] lg:grid-cols-2 xl:grid-cols-3">
        <motion.section variants={kpiItem} className="card p-6">
          <h2 className="text-lg font-semibold text-ink">Bookings by status</h2>
          <p className="mb-5 text-sm text-ink/55">All time</p>
          <HorizontalBars rows={statusRows} />
        </motion.section>
        <motion.section variants={kpiItem} className="card p-6">
          <h2 className="text-lg font-semibold text-ink">Rooms booked</h2>
          <p className="mb-4 text-sm text-ink/55">By room type, excluding cancellations</p>
          <RoomTypeDonut data={data.byRoomType} />
        </motion.section>
        <motion.section variants={kpiItem} className="card p-6 lg:col-span-2 xl:col-span-1">
          <h2 className="text-lg font-semibold text-ink">Guests</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-mist p-4">
              <p className="flex items-center gap-1.5 text-3xl font-bold text-ink tabular-nums"><CountUp value={data.feedback.average} format={(n) => n.toFixed(1)} /><Star size={22} className="fill-brass text-brass" aria-hidden="true" /></p>
              <p className="mt-1 text-xs text-ink/60">Average rating · {data.feedback.total} reviews</p>
            </div>
            <div className="rounded-xl bg-mist p-4">
              <p className="text-3xl font-bold text-ink tabular-nums"><CountUp value={data.totalGuests} /></p>
              <p className="mt-1 text-xs text-ink/60">Registered guests</p>
            </div>
            <Link to="/admin/enquiries" className="col-span-2 flex items-center justify-between rounded-xl border border-[#eef0f3] p-4 hover:bg-mist">
              <span className="flex items-center gap-3"><Inbox size={20} className="text-ocean" aria-hidden="true" /><span><span className="block font-semibold text-ink">{data.enquiries.new} new enquiries</span><span className="text-xs text-ink/60">{data.enquiries.total} in total</span></span></span>
              <span className="text-sm font-semibold text-ocean">Reply →</span>
            </Link>
          </div>
        </motion.section>
      </div>

      {/* Latest bookings */}
      <motion.section variants={kpiItem} className="card mt-[30px]">
        <div className="flex items-center justify-between border-b border-[#e6e6e6] px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Latest bookings</h2>
          <Link to="/admin/bookings" className="btn-primary !py-1.5 text-sm">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[15px]">
            <thead>
              <tr><th className="px-6 py-3">Booking ID</th><th className="px-3 py-3">Guest</th><th className="px-3 py-3">Room</th><th className="px-3 py-3">Dates</th><th className="px-3 py-3 text-right">Total</th><th className="px-3 py-3 text-center">Status</th><th className="px-6 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {data.recent.map((b) => (
                <tr key={b.id} className="border-t border-[#e9ecef] text-[#555]">
                  <td className="whitespace-nowrap px-6 py-3">{b.reference}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-[#333]">{b.guest_name}<span className="block text-xs text-ink/55">{b.guest_email}</span></td>
                  <td className="whitespace-nowrap px-3 py-3">{b.room_name}<span className="block text-xs text-ink/55">{b.room_is_ac ? 'AC' : 'Non-AC'} · {b.hotel_name}</span></td>
                  <td className="whitespace-nowrap px-3 py-3">{formatDate(b.check_in, { day: 'numeric', month: 'short' })} – {formatDate(b.check_out, { day: 'numeric', month: 'short' })}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">{formatMoney(b.total_price)}</td>
                  <td className="px-3 py-3 text-center"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-3">
                    {b.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button className="btn-primary !px-3 !py-1 !text-xs" onClick={() => act(b, 'confirmed')}>Confirm</button>
                        <button className="btn-ghost !px-3 !py-1 !text-xs !text-coral" onClick={() => act(b, 'cancelled')}>Decline</button>
                      </div>
                    ) : <span className="block text-right text-xs text-ink/40">—</span>}
                  </td>
                </tr>
              ))}
              {data.recent.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-ink/55">No bookings yet. New bookings appear here instantly.</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
}
