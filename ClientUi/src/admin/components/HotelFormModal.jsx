import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const empty = { name: '', city: '', address: '', phone: '', star_rating: 3, description: '', image_url: '', is_active: true };

export default function HotelFormModal({ open, hotel, saving, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(hotel ? { ...hotel, address: hotel.address ?? '', phone: hotel.phone ?? '', description: hotel.description ?? '', image_url: hotel.image_url ?? '' } : empty);
  }, [open, hotel]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError('Give the hotel a name');
    if (form.city.trim().length < 2) return setError('Enter the city the hotel is in');
    setError('');
    return onSave({
      id: hotel?.id,
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      star_rating: Number(form.star_rating),
      description: form.description,
      image_url: form.image_url || null,
      is_active: form.is_active,
    });
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={hotel ? 'Edit hotel' : 'Add a hotel'}
      footer={<>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" form="hotel-form" className="btn-primary" disabled={saving}>{saving && <Spinner />} {hotel ? 'Save changes' : 'Add hotel'}</button>
      </>}>
      <form id="hotel-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><label className="label" htmlFor="hf-name">Hotel name</label><input id="hf-name" className="field" value={form.name} onChange={set('name')} /></div>
        <div><label className="label" htmlFor="hf-city">City</label><input id="hf-city" className="field" value={form.city} onChange={set('city')} /></div>
        <div><label className="label" htmlFor="hf-stars">Star rating</label>
          <select id="hf-stars" className="field" value={form.star_rating} onChange={set('star_rating')}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="hf-address">Address</label><input id="hf-address" className="field" value={form.address} onChange={set('address')} /></div>
        <div><label className="label" htmlFor="hf-phone">Phone</label><input id="hf-phone" type="tel" className="field" value={form.phone} onChange={set('phone')} /></div>
        <div><label className="label" htmlFor="hf-img">Image URL</label><input id="hf-img" className="field" placeholder="https://…" value={form.image_url} onChange={set('image_url')} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="hf-desc">Description</label><textarea id="hf-desc" rows={3} className="field" value={form.description} onChange={set('description')} /></div>
        {hotel && (
          <label className="flex items-center gap-3 text-sm font-semibold text-ocean sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-ocean" checked={form.is_active} onChange={set('is_active')} /> Visible on the website, with all its rooms
          </label>
        )}
        {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral sm:col-span-2" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
