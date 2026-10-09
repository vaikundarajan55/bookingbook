import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { changeBookingStatus, fetchAdminBookings } from '../store/adminBookingSlice.js';
import { formatDate, formatMoney, nightsBetween, statusLabel } from '../../core/format.js';
import { CalendarX2, FileText } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PaymentBadge from '../../components/ui/PaymentBadge.jsx';
import { fetchAdminHotels } from '../store/adminHotelSlice.js';

const TABS = ['', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
const ACTIONS = {
  pending: [['confirmed', 'Confirm', 'btn-primary'], ['cancelled', 'Decline', 'btn-ghost !text-coral']],
  confirmed: [['checked_in', 'Check in', 'btn-primary'], ['cancelled', 'Cancel', 'btn-ghost !text-coral']],
  checked_in: [['checked_out', 'Check out', 'btn-primary']],
};

export default function BookingsManager() {
  const dispatch = useDispatch();
  const { items, status, updatingId } = useSelector((s) => s.adminBookings);
  const hotels = useSelector((s) => s.adminHotels.items);
  const [tab, setTab] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [params] = useSearchParams();
  const urlSearch = params.get('search') || '';
  const [search, setSearch] = useState(urlSearch);
  const [debounced, setDebounced] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(null);

  // The header search box navigates here with ?search=
  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);
  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { dispatch(fetchAdminHotels()); }, [dispatch]);
  useEffect(() => { dispatch(fetchAdminBookings({ status: tab, search: debounced, hotelId })); }, [dispatch, tab, debounced, hotelId]);

  const run = async (booking, next) => {
    const result = await dispatch(changeBookingStatus({ id: booking.id, status: next }));
    if (changeBookingStatus.fulfilled.match(result)) toast.success(`${booking.reference} is now ${statusLabel(next).toLowerCase()}`);
    else toast.error(result.payload);
    setConfirmCancel(null);
  };

  // Live socket updates may add rows or change a row's status, so filter again on the client
  const visible = items.filter((b) => (!tab || b.status === tab) && (!hotelId || String(b.hotel_id) === hotelId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold text-ocean">Bookings</h1><p className="mt-1 text-ink/60">New requests appear here the moment a guest books.</p></div>
        <div className="flex flex-wrap gap-3">
          <select className="field !w-56" value={hotelId} onChange={(e) => setHotelId(e.target.value)} aria-label="Filter by hotel">
            <option value="">All hotels</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <input className="field !w-72" placeholder="Search guest, email, room or reference" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search bookings" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t || 'all'} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-ocean text-white' : 'bg-white text-ocean ring-1 ring-ocean/10 hover:bg-ocean-100'}`}>
            {t ? statusLabel(t) : 'All'}
          </button>
        ))}
      </div>

      {status === 'loading' && !items.length ? <div className="skeleton h-64" /> : visible.length === 0 ? (
        <EmptyState icon={CalendarX2} title="No bookings match" text="Try another status or clear the search." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-mist text-xs font-semibold text-ink/55"><tr><th className="px-6 py-3">Booking</th><th className="px-3 py-3">Guest</th><th className="px-3 py-3">Stay</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Payment</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id} className="border-t border-ocean/5 align-top">
                  <td className="px-6 py-4"><p className="font-semibold text-ocean">{b.reference}</p><p className="text-xs text-ink/55">{b.hotel_name ? `${b.hotel_name} · ` : ''}{b.room_name} · {b.room_is_ac ? 'AC' : 'Non-AC'}</p></td>
                  <td className="px-3 py-4"><p className="font-semibold">{b.guest_name}</p><p className="whitespace-nowrap text-xs text-ink/55">{b.guest_email}</p></td>
                  <td className="px-3 py-4"><p>{formatDate(b.check_in)} → {formatDate(b.check_out)}</p><p className="text-xs text-ink/55">{nightsBetween(b.check_in, b.check_out)} nights · {b.guests} guests</p>{b.notes && <p className="mt-1 max-w-xs text-xs italic text-ink/55">“{b.notes}”</p>}</td>
                  <td className="px-3 py-4 font-semibold">{formatMoney(b.total_price)}</td>
                  <td className="px-3 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-3 py-4">{b.status === 'cancelled' ? <span className="text-xs text-ink/45">—</span> : <PaymentBadge status={b.payment_status} />}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {updatingId === b.id && <Spinner className="mt-2 h-4 w-4 text-ocean" />}
                      {(ACTIONS[b.status] || []).map(([next, label, cls]) => (
                        <button key={next} className={`${cls} !px-3 !py-1.5 !text-xs`} disabled={updatingId === b.id}
                          onClick={() => (next === 'cancelled' ? setConfirmCancel(b) : run(b, next))}>{label}</button>
                      ))}
                      {b.status !== 'cancelled' && <Link to={`/admin/invoices/${b.id}`} className="btn-ghost !px-3 !py-1.5 !text-xs" aria-label={`Invoice for ${b.reference}`}><FileText size={14} /> Invoice</Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(confirmCancel)} onClose={() => setConfirmCancel(null)} title="Cancel this booking?" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setConfirmCancel(null)}>Keep booking</button><button className="btn-danger" onClick={() => run(confirmCancel, 'cancelled')}>Cancel booking</button></>}>
        <p className="text-sm text-ink/70">{confirmCancel && `${confirmCancel.guest_name} will be notified straight away and ${confirmCancel.room_name} becomes available for ${formatDate(confirmCancel.check_in)} to ${formatDate(confirmCancel.check_out)}.`}</p>
      </Modal>
    </div>
  );
}
