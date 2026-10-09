import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Check, MessageSquareHeart, Star, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { deleteFeedback, fetchFeedback, setFeedbackStatus } from '../store/adminFeedbackSlice.js';
import { fetchAdminHotels } from '../store/adminHotelSlice.js';
import { formatDate } from '../../core/format.js';

const STATUS_TABS = [['', 'All'], ['new', 'New'], ['reviewed', 'Reviewed']];

export const Stars = ({ value, size = 14 }) => (
  <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} aria-hidden="true" className={n <= value ? 'fill-brass text-brass' : 'text-ink/20'} />)}
  </span>
);

export default function FeedbackManager() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.adminFeedback);
  const hotels = useSelector((s) => s.adminHotels.items);
  const [tab, setTab] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [rating, setRating] = useState('');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { dispatch(fetchAdminHotels()); }, [dispatch]);
  useEffect(() => { dispatch(fetchFeedback({ status: tab, hotelId, rating })); }, [dispatch, tab, hotelId, rating]);

  const toggleReviewed = async (f) => {
    const next = f.status === 'new' ? 'reviewed' : 'new';
    const result = await dispatch(setFeedbackStatus({ id: f.id, status: next }));
    if (!setFeedbackStatus.fulfilled.match(result)) toast.error(result.payload);
  };

  const onDelete = async () => {
    const result = await dispatch(deleteFeedback(toDelete.id));
    if (deleteFeedback.fulfilled.match(result)) toast.success('Feedback deleted'); else toast.error(result.payload);
    setToDelete(null);
  };

  // Live socket additions ignore the active filters, so filter again on the client
  const shown = items.filter((f) => (!tab || f.status === tab) && (!hotelId || String(f.hotel_id) === hotelId) && (!rating || String(f.rating) === rating));
  const average = shown.length ? (shown.reduce((sum, f) => sum + f.rating, 0) / shown.length).toFixed(1) : '–';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold text-ocean">Feedback</h1><p className="mt-1 text-ink/60">What guests say about their stay.</p></div>
        <div className="card flex items-center gap-3 px-5 py-3">
          <p className="font-display text-3xl font-bold text-ocean">{average}</p>
          <div><Stars value={Math.round(Number(average) || 0)} /><p className="text-xs text-ink/55">{shown.length} review{shown.length === 1 ? '' : 's'}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="tablist">
          {STATUS_TABS.map(([value, label]) => (
            <button key={label} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === value ? 'bg-ocean text-white' : 'bg-white text-ocean ring-1 ring-ocean/10 hover:bg-ocean-100'}`}>{label}</button>
          ))}
        </div>
        <select className="field !w-56" value={hotelId} onChange={(e) => setHotelId(e.target.value)} aria-label="Filter by hotel">
          <option value="">All hotels</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select className="field !w-40" value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Filter by rating">
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      {status === 'loading' && !items.length ? <div className="skeleton h-64" /> : !shown.length ? (
        <EmptyState icon={MessageSquareHeart} title="No feedback yet" text="Guests can leave feedback from the website after signing in." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((f) => (
            <article key={f.id} className={`card p-5 ${f.status === 'new' ? 'ring-2 ring-brass/40' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Stars value={f.rating} size={16} />
                  <p className="mt-1 font-semibold text-ocean">{f.guest_name} <span className="text-xs font-normal text-ink/55">· {f.guest_email}</span></p>
                  <p className="text-xs text-ink/55">{f.hotel_name || 'General'} · {formatDate(f.created_at)}</p>
                </div>
                {f.status === 'new' && <span className="rounded-full bg-brass-100 px-2.5 py-1 text-xs font-semibold text-brass-600">New</span>}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">{f.comment}</p>
              <div className="mt-4 flex gap-2">
                <button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => toggleReviewed(f)}><Check size={14} /> {f.status === 'new' ? 'Mark reviewed' : 'Mark as new'}</button>
                <button className="btn-ghost !px-3 !py-1.5 !text-xs !text-coral" onClick={() => setToDelete(f)} aria-label="Delete feedback"><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete this feedback?" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setToDelete(null)}>Keep</button><button className="btn-danger" onClick={onDelete}>Delete</button></>}>
        <p className="text-sm text-ink/70">The review from {toDelete?.guest_name} will be permanently deleted.</p>
      </Modal>
    </div>
  );
}
