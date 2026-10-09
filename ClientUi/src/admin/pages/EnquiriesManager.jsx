import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Inbox, Mail, Phone, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { deleteEnquiry, fetchEnquiries, setEnquiryStatus } from '../store/adminEnquirySlice.js';
import { formatDate } from '../../core/format.js';

const STATUSES = [['new', 'New', 'bg-brass-100 text-brass-600'], ['in_progress', 'In progress', 'bg-ocean-100 text-ocean-700'], ['closed', 'Closed', 'bg-ocean/5 text-ink/60']];

export default function EnquiriesManager() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.adminEnquiries);
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { dispatch(fetchEnquiries({ status: tab, search: debounced })); }, [dispatch, tab, debounced]);

  const changeStatus = async (q, next) => {
    const result = await dispatch(setEnquiryStatus({ id: q.id, status: next }));
    if (setEnquiryStatus.fulfilled.match(result)) toast.success(`Enquiry from ${q.name} is now ${STATUSES.find(([v]) => v === next)[1].toLowerCase()}`);
    else toast.error(result.payload);
  };

  const onDelete = async () => {
    const result = await dispatch(deleteEnquiry(toDelete.id));
    if (deleteEnquiry.fulfilled.match(result)) toast.success('Enquiry deleted'); else toast.error(result.payload);
    setToDelete(null);
  };

  const shown = tab ? items.filter((q) => q.status === tab) : items; // live additions may not match the tab
  const counts = Object.fromEntries(STATUSES.map(([v]) => [v, items.filter((q) => q.status === v).length]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold text-ocean">Enquiries</h1><p className="mt-1 text-ink/60">Messages sent from the website contact form.</p></div>
        <input className="field !w-72" placeholder="Search name, email or subject" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search enquiries" />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {[['', 'All', null], ...STATUSES].map(([value, label]) => (
          <button key={label} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === value ? 'bg-ocean text-white' : 'bg-white text-ocean ring-1 ring-ocean/10 hover:bg-ocean-100'}`}>
            {label}{value && !tab ? ` (${counts[value]})` : ''}
          </button>
        ))}
      </div>

      {status === 'loading' && !items.length ? <div className="skeleton h-64" /> : !shown.length ? (
        <EmptyState icon={Inbox} title="No enquiries" text="New messages from the contact page appear here instantly." />
      ) : (
        <div className="space-y-4">
          {shown.map((q) => {
            const [, label, cls] = STATUSES.find(([v]) => v === q.status);
            return (
              <article key={q.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ocean">{q.subject}</p>
                    <p className="mt-0.5 text-sm text-ink/70">{q.name}{q.hotel_name ? ` · about ${q.hotel_name}` : ''} · {formatDate(q.created_at)}</p>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-ink/60">
                      <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.subject}`)}`} className="inline-flex items-center gap-1 hover:text-ocean"><Mail size={12} /> {q.email}</a>
                      {q.phone && <a href={`tel:${q.phone}`} className="inline-flex items-center gap-1 hover:text-ocean"><Phone size={12} /> {q.phone}</a>}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">{q.message}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <select className="field !w-44 !py-1.5" value={q.status} onChange={(e) => changeStatus(q, e.target.value)} aria-label={`Status of enquiry from ${q.name}`}>
                    {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <a className="btn-ghost !px-3 !py-1.5 !text-xs" href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.subject}`)}`}><Mail size={14} /> Reply by email</a>
                  <button className="btn-ghost !px-3 !py-1.5 !text-xs !text-coral" onClick={() => setToDelete(q)} aria-label="Delete enquiry"><Trash2 size={14} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete this enquiry?" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setToDelete(null)}>Keep</button><button className="btn-danger" onClick={onDelete}>Delete</button></>}>
        <p className="text-sm text-ink/70">The message from {toDelete?.name} will be permanently deleted.</p>
      </Modal>
    </div>
  );
}
