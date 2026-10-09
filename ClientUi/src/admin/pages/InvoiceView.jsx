import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer } from 'lucide-react';
import PageLoader from '../../components/ui/PageLoader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import InvoiceDocument from '../../components/ui/InvoiceDocument.jsx';
import { fetchInvoice, updatePayment } from '../store/adminInvoiceSlice.js';

const METHODS = [['cash', 'Cash'], ['card', 'Card'], ['upi', 'UPI'], ['bank_transfer', 'Bank transfer']];

export default function InvoiceView() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: inv, currentStatus, saving } = useSelector((s) => s.adminInvoices);
  const [method, setMethod] = useState('cash');

  useEffect(() => { dispatch(fetchInvoice(id)); }, [dispatch, id]);

  const setPaid = async (paymentStatus) => {
    const result = await dispatch(updatePayment({ id: inv.id, payment_status: paymentStatus, payment_method: paymentStatus === 'paid' ? method : undefined }));
    if (updatePayment.fulfilled.match(result)) toast.success(paymentStatus === 'paid' ? `${inv.invoice_number} marked as paid` : `${inv.invoice_number} marked as unpaid`);
    else toast.error(result.payload);
  };

  // The store may still hold the previously opened invoice for one render
  if (currentStatus === 'loading' || (currentStatus === 'idle' && !inv) || (inv && String(inv.id) !== id)) return <PageLoader label="Loading invoice" />;
  if (!inv) return <EmptyState title="Invoice not found" text="The booking may have been removed." action={<Link to="/admin/invoices" className="btn-primary">Back to invoices</Link>} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/admin/invoices" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-500 hover:text-ocean"><ArrowLeft size={16} /> All invoices</Link>
        <div className="flex flex-wrap items-center gap-2">
          {inv.status !== 'cancelled' && (inv.payment_status === 'paid' ? (
            <button className="btn-ghost" onClick={() => setPaid('unpaid')} disabled={saving}>{saving && <Spinner />} Mark as unpaid</button>
          ) : (
            <>
              <select className="field !w-40" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment method">
                {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className="btn-primary" onClick={() => setPaid('paid')} disabled={saving}>{saving && <Spinner />} Mark as paid</button>
            </>
          ))}
          <button className="btn-ghost" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>
      </div>

      <InvoiceDocument inv={inv} />
    </div>
  );
}
