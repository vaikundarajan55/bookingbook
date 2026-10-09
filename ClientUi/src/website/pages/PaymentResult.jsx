import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, RotateCcw, XCircle } from 'lucide-react';
import PageLoader from '../../components/ui/PageLoader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import CheckoutSteps from '../components/CheckoutSteps.jsx';
import { webApi } from '../services/api.js';
import { formatDate, formatMoney } from '../../core/format.js';
import { PAYMENT_METHOD_LABELS } from '../../components/ui/InvoiceDocument.jsx';

/** Shared success / failure page; `outcome` comes from the route. The payment itself is re-read from the server. */
export default function PaymentResult({ outcome }) {
  const [params] = useSearchParams();
  const ref = params.get('ref');
  const [payment, setPayment] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!ref) { setState('missing'); return; }
    webApi.get(`/payments/${encodeURIComponent(ref)}`)
      .then(({ data }) => { setPayment(data.data); setState('ready'); })
      .catch(() => setState('missing'));
  }, [ref]);

  if (state === 'loading') return <PageLoader label="Checking your payment" />;
  if (state === 'missing') return <div className="mx-auto max-w-xl px-5 py-20"><EmptyState title="Payment not found" text="Check My bookings for the latest status." action={<Link to="/account/bookings" className="btn-primary">My bookings</Link>} /></div>;

  // Trust the server's record over the URL
  const success = payment.status === 'success';
  if ((outcome === 'success') !== success) {
    return <div className="mx-auto max-w-xl px-5 py-20"><EmptyState title={success ? 'This payment succeeded' : 'This payment did not go through'} action={<Link to={`/payment/${success ? 'success' : 'failed'}?ref=${ref}`} className="btn-primary">View details</Link>} /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <CheckoutSteps current={success ? 4 : 2} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8 text-center sm:p-10" role="status">
        {success
          ? <CheckCircle2 size={56} className="mx-auto text-moss" aria-hidden="true" />
          : <XCircle size={56} className="mx-auto text-coral" aria-hidden="true" />}
        <h1 className="mt-4 text-3xl font-semibold text-ocean">{success ? 'Payment successful' : 'Payment failed'}</h1>
        <p className="mt-2 text-ink/70">
          {success
            ? `We received ${formatMoney(payment.amount)}. A confirmation is on its way, and the hotel will confirm your booking shortly.`
            : payment.failure_reason || 'The payment could not be completed.'}
        </p>
        {!success && <p className="mt-1 text-sm text-ink/55">No money was taken. Your rooms are still held, so you can try again.</p>}

        <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-mist p-4 text-left text-sm">
          <dt className="text-ink/55">Reference</dt><dd className="text-right font-semibold">{payment.reference}</dd>
          <dt className="text-ink/55">Method</dt><dd className="text-right font-semibold">{PAYMENT_METHOD_LABELS[payment.method]}{payment.card_last4 ? ` ···· ${payment.card_last4}` : ''}</dd>
          <dt className="text-ink/55">Amount</dt><dd className="text-right font-semibold">{formatMoney(payment.amount)}</dd>
          <dt className="text-ink/55">Date</dt><dd className="text-right font-semibold">{formatDate(payment.created_at)}</dd>
        </dl>

        <ul className="mx-auto mt-6 max-w-md divide-y divide-ocean/10 text-left text-sm">
          {payment.bookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3">
              <span><span className="block font-semibold text-ocean">{b.room_name}</span><span className="text-ink/55">{b.reference} · {formatDate(b.check_in)} → {formatDate(b.check_out)}</span></span>
              {success && <Link to={`/account/bookings/${b.id}/invoice`} className="btn-ghost !px-3 !py-1.5 !text-xs"><FileText size={14} /> Invoice</Link>}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {success ? (
            <>
              <Link to="/account/bookings" className="btn-primary">View my bookings</Link>
              <Link to="/rooms" className="btn-ghost">Book another room</Link>
            </>
          ) : (
            <>
              <Link to={`/payment?bookings=${payment.booking_ids.join(',')}`} className="btn-primary"><RotateCcw size={16} /> Try again</Link>
              <Link to="/account/bookings" className="btn-ghost">Pay later</Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
