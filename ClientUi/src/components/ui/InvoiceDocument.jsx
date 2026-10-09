import PaymentBadge from './PaymentBadge.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatDate } from '../../core/format.js';

export const PAYMENT_METHOD_LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI', netbanking: 'Net banking', bank_transfer: 'Bank transfer' };

// formatMoney rounds to whole units; invoices need exact amounts
const exact = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: import.meta.env.VITE_CURRENCY || 'USD' }).format(Number(n) || 0);

/** The printable invoice body, shared by the admin console and the guest account. */
export default function InvoiceDocument({ inv }) {
  return (
    <article className="card p-8 print:p-0 print:shadow-none print:ring-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ocean/10 pb-6">
        <div>
          <p className="font-display text-2xl font-bold text-ocean">{inv.hotel_name}</p>
          <p className="mt-1 text-sm text-ink/60">{[inv.hotel_address, inv.hotel_city].filter(Boolean).join(', ')}</p>
          {inv.hotel_phone && <p className="text-sm text-ink/60">{inv.hotel_phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Invoice</p>
          <p className="font-display text-xl font-bold text-ocean">{inv.invoice_number}</p>
          <p className="text-sm text-ink/60">Issued {formatDate(inv.created_at)}</p>
          <div className="mt-2"><PaymentBadge status={inv.payment_status} /></div>
        </div>
      </header>

      <section className="grid gap-6 border-b border-ocean/10 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Billed to</p>
          <p className="mt-1 font-semibold text-ocean">{inv.guest_name}</p>
          <p className="text-sm text-ink/60">{inv.guest_email}</p>
          {inv.guest_phone && <p className="text-sm text-ink/60">{inv.guest_phone}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Booking</p>
          <p className="mt-1 font-semibold text-ocean">{inv.reference}</p>
          <p className="text-sm text-ink/60">{formatDate(inv.check_in)} → {formatDate(inv.check_out)}</p>
          <div className="mt-1 print:hidden"><StatusBadge status={inv.status} /></div>
        </div>
      </section>

      <div className="overflow-x-auto">
        <table className="mt-6 w-full min-w-[420px] text-sm">
          <thead className="text-left text-xs font-semibold text-ink/55">
            <tr><th className="pb-2">Description</th><th className="pb-2 text-center">Nights</th><th className="pb-2 text-right">Rate</th><th className="pb-2 text-right">Amount</th></tr>
          </thead>
          <tbody>
            <tr className="border-t border-ocean/10">
              <td className="py-3"><p className="font-semibold">{inv.room_name}</p><p className="text-xs capitalize text-ink/55">{inv.room_type} · {inv.room_is_ac ? 'AC' : 'Non-AC'} · {inv.guests} guest{inv.guests > 1 ? 's' : ''}</p></td>
              <td className="py-3 text-center">{inv.nights}</td>
              <td className="py-3 text-right">{exact(inv.grand_total / (inv.nights || 1))}</td>
              <td className="py-3 text-right">{exact(inv.grand_total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-2 border-t border-ocean/10 pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-ink/60">Subtotal (before tax)</dt><dd>{exact(inv.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink/60">Tax ({inv.tax_rate}%)</dt><dd>{exact(inv.tax_amount)}</dd></div>
        <div className="flex justify-between border-t border-ocean/10 pt-2 text-base font-bold text-ocean"><dt>Total</dt><dd>{exact(inv.grand_total)}</dd></div>
        {inv.payment_status === 'paid' && (
          <div className="flex justify-between text-moss"><dt>Paid by {PAYMENT_METHOD_LABELS[inv.payment_method] ?? inv.payment_method}</dt><dd>{formatDate(inv.paid_at)}</dd></div>
        )}
        {inv.payment_ref && <div className="flex justify-between text-xs text-ink/55"><dt>Payment ref.</dt><dd>{inv.payment_ref}</dd></div>}
      </dl>

      <p className="mt-8 text-center text-xs text-ink/45">Room rates include {inv.tax_rate}% tax. Thank you for staying with us.</p>
    </article>
  );
}
