import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FileText, ReceiptText } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState.jsx';
import PaymentBadge from '../../components/ui/PaymentBadge.jsx';
import { fetchInvoices } from '../store/adminInvoiceSlice.js';
import { fetchAdminHotels } from '../store/adminHotelSlice.js';
import { formatDate, formatMoney } from '../../core/format.js';

const PAYMENT_TABS = [['', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']];

export default function InvoicesManager() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.adminInvoices);
  const hotels = useSelector((s) => s.adminHotels.items);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => { dispatch(fetchAdminHotels()); }, [dispatch]);
  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { dispatch(fetchInvoices({ paymentStatus, hotelId, search: debounced })); }, [dispatch, paymentStatus, hotelId, debounced]);

  const paid = items.filter((i) => i.payment_status === 'paid').reduce((sum, i) => sum + i.grand_total, 0);
  const due = items.filter((i) => i.payment_status !== 'paid').reduce((sum, i) => sum + i.grand_total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ocean">Invoices</h1>
          <p className="mt-1 text-ink/60">One invoice per booking (cancelled bookings are not billed).</p>
        </div>
        <div className="flex gap-3">
          <div className="card px-5 py-3"><p className="text-xs font-semibold text-ink/55">Collected</p><p className="font-display text-xl font-bold text-moss">{formatMoney(paid)}</p></div>
          <div className="card px-5 py-3"><p className="text-xs font-semibold text-ink/55">Outstanding</p><p className="font-display text-xl font-bold text-coral">{formatMoney(due)}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="tablist">
          {PAYMENT_TABS.map(([value, label]) => (
            <button key={label} role="tab" aria-selected={paymentStatus === value} onClick={() => setPaymentStatus(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${paymentStatus === value ? 'bg-ocean text-white' : 'bg-white text-ocean ring-1 ring-ocean/10 hover:bg-ocean-100'}`}>{label}</button>
          ))}
        </div>
        <select className="field !w-56" value={hotelId} onChange={(e) => setHotelId(e.target.value)} aria-label="Filter by hotel">
          <option value="">All hotels</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <input className="field !w-64" placeholder="Search guest, email or reference" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search invoices" />
      </div>

      {status === 'loading' && !items.length ? <div className="skeleton h-64" /> : !items.length ? (
        <EmptyState icon={ReceiptText} title="No invoices yet" text="An invoice appears here as soon as a guest books." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-mist text-xs font-semibold text-ink/55">
              <tr><th className="px-6 py-3">Invoice</th><th className="px-3 py-3">Guest</th><th className="px-3 py-3">Hotel / room</th><th className="px-3 py-3">Stay</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Payment</th><th className="px-6 py-3 text-right" /></tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-t border-ocean/5">
                  <td className="px-6 py-3"><p className="font-semibold text-ocean">{inv.invoice_number}</p><p className="text-xs text-ink/55">{inv.reference} · {formatDate(inv.created_at)}</p></td>
                  <td className="px-3 py-3"><p className="font-semibold">{inv.guest_name}</p><p className="text-xs text-ink/55">{inv.guest_email}</p></td>
                  <td className="px-3 py-3"><p>{inv.hotel_name}</p><p className="text-xs text-ink/55">{inv.room_name} · {inv.room_is_ac ? 'AC' : 'Non-AC'}</p></td>
                  <td className="px-3 py-3">{formatDate(inv.check_in)} → {formatDate(inv.check_out)}</td>
                  <td className="px-3 py-3 font-semibold">{formatMoney(inv.grand_total)}</td>
                  <td className="px-3 py-3"><PaymentBadge status={inv.payment_status} /></td>
                  <td className="px-6 py-3 text-right"><Link to={`/admin/invoices/${inv.id}`} className="btn-ghost !px-3 !py-1.5"><FileText size={14} /> View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
