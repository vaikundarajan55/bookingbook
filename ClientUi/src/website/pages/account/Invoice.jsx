import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Printer } from 'lucide-react';
import PageLoader from '../../../components/ui/PageLoader.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import InvoiceDocument from '../../../components/ui/InvoiceDocument.jsx';
import { webApi } from '../../services/api.js';

export default function Invoice() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    setState('loading');
    webApi.get(`/invoices/mine/${id}`)
      .then(({ data }) => { setInv(data.data); setState('ready'); })
      .catch(() => setState('missing'));
  }, [id]);

  if (state === 'loading') return <PageLoader label="Loading invoice" />;
  if (state === 'missing') return <EmptyState title="Invoice not found" text="Cancelled bookings have no invoice." action={<Link to="/account/bookings" className="btn-primary">My bookings</Link>} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/account/bookings" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-500 hover:text-ocean"><ArrowLeft size={16} /> My bookings</Link>
        <div className="flex gap-2">
          {inv.payment_status !== 'paid' && <Link to={`/payment?bookings=${inv.id}`} className="btn-brass"><CreditCard size={16} /> Pay now</Link>}
          <button className="btn-ghost" onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</button>
        </div>
      </div>
      <InvoiceDocument inv={inv} />
    </div>
  );
}
