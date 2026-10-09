import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Archive, BedDouble, Pencil, Plus, Star } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import HotelFormModal from '../components/HotelFormModal.jsx';
import { archiveHotel, fetchAdminHotels, saveHotel } from '../store/adminHotelSlice.js';

export default function HotelsManager() {
  const dispatch = useDispatch();
  const { items, status, saving } = useSelector((s) => s.adminHotels);
  const [editing, setEditing] = useState(null); // null (new) | hotel
  const [formOpen, setFormOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);

  // Refetch on every visit so the room counts reflect changes made on the Rooms page
  useEffect(() => { dispatch(fetchAdminHotels()); }, [dispatch]);

  const openForm = (hotel = null) => { setEditing(hotel); setFormOpen(true); };

  const onSave = async (payload) => {
    const result = await dispatch(saveHotel(payload));
    if (saveHotel.fulfilled.match(result)) { toast.success(payload.id ? 'Hotel updated' : 'Hotel added'); setFormOpen(false); } else toast.error(result.payload);
  };

  const onArchive = async () => {
    const result = await dispatch(archiveHotel(toArchive.id));
    if (archiveHotel.fulfilled.match(result)) toast.success(`${toArchive.name} hidden from the website`); else toast.error(result.payload);
    setToArchive(null);
  };

  if (status === 'loading' && !items.length) return <PageLoader label="Loading hotels" />;

  const visible = items.filter((h) => h.is_active);
  const acTotal = visible.reduce((sum, h) => sum + h.ac_rooms_count, 0);
  const nonAcTotal = visible.reduce((sum, h) => sum + h.non_ac_rooms_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ocean">Hotels</h1>
          <p className="mt-1 text-ink/60">{visible.length} visible on the website · {acTotal} AC and {nonAcTotal} Non-AC rooms</p>
        </div>
        <button className="btn-brass" onClick={() => openForm()}><Plus size={16} /> Add hotel</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-mist text-xs font-semibold text-ink/55">
            <tr>
              <th className="px-6 py-3">Hotel</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3 text-center">Rooms</th>
              <th className="px-3 py-3 text-center">AC</th><th className="px-3 py-3 text-center">Non-AC</th><th className="px-3 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((h) => (
              <tr key={h.id} className={`border-t border-ocean/5 ${h.is_active ? '' : 'opacity-60'}`}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ocean-100">{h.image_url && <img src={h.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />}</div>
                    <div><p className="font-semibold text-ocean">{h.name}</p><p className="text-xs text-ink/55">{[h.address, h.city].filter(Boolean).join(', ')}</p></div>
                  </div>
                </td>
                <td className="px-3 py-3"><span className="inline-flex items-center gap-1 font-semibold text-brass-600" aria-label={`${h.star_rating} star hotel`}><Star size={14} className="fill-brass text-brass" aria-hidden="true" /> {h.star_rating}</span></td>
                <td className="px-3 py-3 text-center font-semibold">{h.rooms_count}</td>
                <td className="px-3 py-3 text-center"><span className="rounded-full bg-ocean-100 px-2.5 py-0.5 text-xs font-semibold text-ocean-700">{h.ac_rooms_count}</span></td>
                <td className="px-3 py-3 text-center"><span className="rounded-full bg-brass-100 px-2.5 py-0.5 text-xs font-semibold text-brass-600">{h.non_ac_rooms_count}</span></td>
                <td className="px-3 py-3">{h.is_active ? <span className="text-xs font-semibold text-moss">Visible</span> : <span className="text-xs font-semibold text-coral">Hidden</span>}</td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/rooms?hotel=${h.id}`} className="btn-ghost !px-3 !py-1.5"><BedDouble size={14} /> Rooms</Link>
                    <button className="btn-ghost !px-3 !py-1.5" onClick={() => openForm(h)}><Pencil size={14} /> Edit</button>
                    {h.is_active && <button className="btn-ghost !px-3 !py-1.5 !text-coral" onClick={() => setToArchive(h)} aria-label={`Hide ${h.name}`}><Archive size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7} className="px-6 py-10 text-center text-ink/55">No hotels yet. Add a hotel first, then add its rooms.</td></tr>}
          </tbody>
        </table>
      </div>

      <HotelFormModal open={formOpen} hotel={editing} saving={saving} onClose={() => setFormOpen(false)} onSave={onSave} />

      <Modal open={Boolean(toArchive)} onClose={() => setToArchive(null)} title="Hide this hotel?" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setToArchive(null)}>Keep visible</button><button className="btn-danger" onClick={onArchive}>Hide hotel</button></>}>
        <p className="text-sm text-ink/70">{toArchive?.name} and its {toArchive?.rooms_count} rooms disappear from the website and can no longer be booked. Existing bookings stay in your records, and you can show it again from Edit.</p>
      </Modal>
    </div>
  );
}
