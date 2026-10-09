import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export const DESIGNATIONS = ['Manager', 'Receptionist', 'Housekeeping', 'Chef', 'Waiter', 'Security', 'Maintenance', 'Accountant'];

const empty = { hotel_id: '', name: '', designation: 'Receptionist', email: '', phone: '', salary: '', joined_on: '', is_active: true };

export default function EmployeeFormModal({ open, employee, hotels = [], defaultHotelId = '', saving, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  // Depend on the first hotel's id, not the array, so a hotels refetch never wipes a half-filled form
  const firstHotelId = hotels[0]?.id ?? '';

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(employee
      ? { ...employee, email: employee.email ?? '', phone: employee.phone ?? '', salary: employee.salary ?? '', joined_on: employee.joined_on ?? '' }
      : { ...empty, hotel_id: defaultHotelId || firstHotelId });
  }, [open, employee, defaultHotelId, firstHotelId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.hotel_id) return setError('Choose the hotel this person works at');
    if (form.name.trim().length < 2) return setError('Enter the employee name');
    if (form.designation.trim().length < 2) return setError('Enter a designation');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address');
    setError('');
    return onSave({
      id: employee?.id,
      hotel_id: Number(form.hotel_id),
      name: form.name.trim(),
      designation: form.designation.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      salary: form.salary === '' ? null : Number(form.salary),
      joined_on: form.joined_on || null,
      is_active: form.is_active,
    });
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={employee ? 'Edit employee' : 'Add an employee'}
      footer={<>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" form="employee-form" className="btn-primary" disabled={saving}>{saving && <Spinner />} {employee ? 'Save changes' : 'Add employee'}</button>
      </>}>
      <form id="employee-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><label className="label" htmlFor="ef-hotel">Hotel</label>
          <select id="ef-hotel" className="field" value={form.hotel_id} onChange={set('hotel_id')}>
            <option value="" disabled>Choose a hotel</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
          </select></div>
        <div><label className="label" htmlFor="ef-name">Full name</label><input id="ef-name" className="field" value={form.name} onChange={set('name')} /></div>
        <div><label className="label" htmlFor="ef-role">Designation</label>
          <input id="ef-role" className="field" list="ef-roles" value={form.designation} onChange={set('designation')} />
          <datalist id="ef-roles">{DESIGNATIONS.map((d) => <option key={d} value={d} />)}</datalist></div>
        <div><label className="label" htmlFor="ef-phone">Phone</label><input id="ef-phone" type="tel" className="field" value={form.phone} onChange={set('phone')} /></div>
        <div><label className="label" htmlFor="ef-email">Email</label><input id="ef-email" type="email" className="field" value={form.email} onChange={set('email')} /></div>
        <div><label className="label" htmlFor="ef-salary">Monthly salary</label><input id="ef-salary" type="number" min="0" className="field" value={form.salary} onChange={set('salary')} /></div>
        <div><label className="label" htmlFor="ef-joined">Joined on</label><input id="ef-joined" type="date" className="field" value={form.joined_on} onChange={set('joined_on')} /></div>
        {employee && (
          <label className="flex items-center gap-3 text-sm font-semibold text-ocean sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-ocean" checked={form.is_active} onChange={set('is_active')} /> Currently working
          </label>
        )}
        {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral sm:col-span-2" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
