import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const empty = { hotel_id: '', is_ac: true, name: '', type: 'standard', description: '', price_per_night: '', capacity: 2, size_sqft: '', image_url: '', amenities: '', is_active: true };

export default function RoomFormModal({ open, room, hotels = [], defaultHotelId = '', saving, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  // Depend on the first hotel's id, not the array, so a hotels refetch never wipes a half-filled form
  const firstHotelId = hotels[0]?.id ?? '';

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(room ? { ...room, amenities: (room.amenities || []).join(', '), size_sqft: room.size_sqft ?? '', image_url: room.image_url ?? '', description: room.description ?? '', hotel_id: room.hotel_id ?? '' } : { ...empty, hotel_id: defaultHotelId || firstHotelId });
  }, [open, room, defaultHotelId, firstHotelId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.hotel_id) return setError('Choose which hotel this room belongs to');
    if (form.name.trim().length < 2) return setError('Give the room a name');
    if (!(Number(form.price_per_night) > 0)) return setError('Enter a nightly price above zero');
    setError('');
    return onSave({
      id: room?.id,
      hotel_id: Number(form.hotel_id),
      is_ac: form.is_ac,
      name: form.name.trim(),
      type: form.type,
      description: form.description,
      price_per_night: Number(form.price_per_night),
      capacity: Number(form.capacity),
      size_sqft: form.size_sqft ? Number(form.size_sqft) : null,
      image_url: form.image_url || null,
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      is_active: form.is_active,
    });
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={room ? 'Edit room' : 'Add a room'}
      footer={<>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" form="room-form" className="btn-primary" disabled={saving}>{saving && <Spinner />} {room ? 'Save changes' : 'Add room'}</button>
      </>}>
      <form id="room-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><label className="label" htmlFor="rf-hotel">Hotel</label>
          <select id="rf-hotel" className="field" value={form.hotel_id} onChange={set('hotel_id')}>
            <option value="" disabled>Choose a hotel</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}{h.is_active ? '' : ' (hidden)'}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="rf-name">Room name</label><input id="rf-name" className="field" value={form.name} onChange={set('name')} /></div>
        <div><label className="label" htmlFor="rf-type">Type</label>
          <select id="rf-type" className="field" value={form.type} onChange={set('type')}>{['standard', 'deluxe', 'suite', 'family'].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label className="label" htmlFor="rf-price">Price per night</label><input id="rf-price" type="number" min="1" className="field" value={form.price_per_night} onChange={set('price_per_night')} /></div>
        <div><label className="label" htmlFor="rf-cap">Sleeps up to</label><input id="rf-cap" type="number" min="1" max="12" className="field" value={form.capacity} onChange={set('capacity')} /></div>
        <fieldset className="sm:col-span-2">
          <legend className="label">Air conditioning</legend>
          <div className="grid grid-cols-2 gap-3">
            {[{ value: true, label: 'AC room', hint: 'Air conditioned' }, { value: false, label: 'Non-AC room', hint: 'Fan only' }].map((o) => (
              <label key={o.label} className={`cursor-pointer rounded-xl border px-4 py-3 transition ${form.is_ac === o.value ? 'border-ocean-500 bg-ocean-100 ring-4 ring-ocean-500/15' : 'border-ocean/15 bg-white hover:bg-mist'}`}>
                <input type="radio" name="rf-ac" className="sr-only" checked={form.is_ac === o.value} onChange={() => setForm((f) => ({ ...f, is_ac: o.value }))} />
                <span className="block text-sm font-semibold text-ocean">{o.label}</span>
                <span className="block text-xs text-ink/55">{o.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div><label className="label" htmlFor="rf-size">Size (sq ft)</label><input id="rf-size" type="number" min="0" className="field" value={form.size_sqft} onChange={set('size_sqft')} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="rf-img">Image URL</label><input id="rf-img" className="field" placeholder="https://…" value={form.image_url} onChange={set('image_url')} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="rf-desc">Description</label><textarea id="rf-desc" rows={3} className="field" value={form.description} onChange={set('description')} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="rf-am">Amenities (comma separated)</label><input id="rf-am" className="field" placeholder="Wi-Fi, Sea view, Bathtub" value={form.amenities} onChange={set('amenities')} /></div>
        {room && (
          <label className="flex items-center gap-3 text-sm font-semibold text-ocean sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-ocean" checked={form.is_active} onChange={set('is_active')} /> Visible on the website
          </label>
        )}
        {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral sm:col-span-2" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
