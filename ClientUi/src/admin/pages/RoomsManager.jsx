import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Pencil, Plus, Archive } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import AcBadge from '../../components/ui/AcBadge.jsx';
import RoomFormModal from '../components/RoomFormModal.jsx';
import { archiveRoom, fetchAdminRooms, saveRoom } from '../store/adminRoomSlice.js';
import { fetchAdminHotels } from '../store/adminHotelSlice.js';
import { formatMoney } from '../../core/format.js';

const AC_FILTERS = [{ value: '', label: 'All' }, { value: 'ac', label: 'AC' }, { value: 'non_ac', label: 'Non-AC' }];

export default function RoomsManager() {
  const dispatch = useDispatch();
  const { items, status, saving } = useSelector((s) => s.adminRooms);
  const hotels = useSelector((s) => s.adminHotels.items);
  const [params, setParams] = useSearchParams();
  const hotelFilter = params.get('hotel') || '';
  const acFilter = params.get('ac') || '';
  const [editing, setEditing] = useState(null); // null (new) | room
  const [formOpen, setFormOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);

  useEffect(() => { dispatch(fetchAdminRooms()); dispatch(fetchAdminHotels()); }, [dispatch]);

  const setFilter = (key, value) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); return p; }, { replace: true });

  const shown = useMemo(() => items.filter((r) =>
    (!hotelFilter || String(r.hotel_id) === hotelFilter)
    && (!acFilter || (acFilter === 'ac' ? r.is_ac : !r.is_ac))), [items, hotelFilter, acFilter]);

  const openForm = (room = null) => { setEditing(room); setFormOpen(true); };

  const onSave = async (payload) => {
    const result = await dispatch(saveRoom(payload));
    if (saveRoom.fulfilled.match(result)) { toast.success(payload.id ? 'Room updated' : 'Room added'); setFormOpen(false); } else toast.error(result.payload);
  };

  const onArchive = async () => {
    const result = await dispatch(archiveRoom(toArchive.id));
    if (archiveRoom.fulfilled.match(result)) toast.success(`${toArchive.name} hidden from the website`); else toast.error(result.payload);
    setToArchive(null);
  };

  if (status === 'loading' && !items.length) return <PageLoader label="Loading rooms" />;

  const visibleCount = shown.filter((r) => r.is_active).length;
  const acCount = shown.filter((r) => r.is_active && r.is_ac).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ocean">Rooms</h1>
          <p className="mt-1 text-ink/60">{visibleCount} visible on the website · {acCount} AC, {visibleCount - acCount} Non-AC</p>
        </div>
        <button className="btn-brass" onClick={() => openForm()} disabled={!hotels.length} title={hotels.length ? undefined : 'Add a hotel first'}><Plus size={16} /> Add room</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className="field !w-64" value={hotelFilter} onChange={(e) => setFilter('hotel', e.target.value)} aria-label="Filter by hotel">
          <option value="">All hotels</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}{h.is_active ? '' : ' (hidden)'}</option>)}
        </select>
        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-ocean/10" role="group" aria-label="Filter by air conditioning">
          {AC_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter('ac', f.value)} aria-pressed={acFilter === f.value}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${acFilter === f.value ? 'bg-ocean text-white' : 'text-ocean hover:bg-ocean-100'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {!hotels.length && status !== 'loading' && (
        <p className="rounded-xl bg-brass-100 px-4 py-3 text-sm font-medium text-brass-600">Rooms belong to a hotel. <Link to="/admin/hotels" className="underline">Add a hotel</Link> before adding rooms.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((room) => (
          <article key={room.id} className={`card overflow-hidden ${room.is_active ? '' : 'opacity-60'}`}>
            <div className="relative aspect-[16/9] bg-ocean-100">
              {room.image_url && <img src={room.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
              <div className="absolute left-3 top-3 flex gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-ocean">{room.type}</span>
                <AcBadge isAc={room.is_ac} className="shadow-sm" />
              </div>
              {!room.is_active && <span className="absolute right-3 top-3 rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white">Hidden</span>}
            </div>
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ocean-500"><Building2 size={13} aria-hidden="true" /> {room.hotel_name || 'No hotel'}{room.hotel_city ? ` · ${room.hotel_city}` : ''}</p>
              <h2 className="mt-1 text-lg font-semibold text-ocean">{room.name}</h2>
              <p className="mt-0.5 text-sm text-ink/60">{formatMoney(room.price_per_night)} / night · sleeps {room.capacity}</p>
              <div className="mt-4 flex gap-2">
                <button className="btn-ghost !py-2" onClick={() => openForm(room)}><Pencil size={14} /> Edit</button>
                {room.is_active && <button className="btn-ghost !py-2 !text-coral" onClick={() => setToArchive(room)}><Archive size={14} /> Hide</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && items.length > 0 && <p className="py-10 text-center text-ink/55">No rooms match these filters.</p>}

      <RoomFormModal open={formOpen} room={editing} hotels={hotels} defaultHotelId={hotelFilter} saving={saving} onClose={() => setFormOpen(false)} onSave={onSave} />

      <Modal open={Boolean(toArchive)} onClose={() => setToArchive(null)} title="Hide this room?" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setToArchive(null)}>Keep visible</button><button className="btn-danger" onClick={onArchive}>Hide room</button></>}>
        <p className="text-sm text-ink/70">{toArchive?.name} disappears from the website. Existing bookings stay in your records, and you can show it again from Edit.</p>
      </Modal>
    </div>
  );
}
