import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import EmployeeFormModal, { DESIGNATIONS } from '../components/EmployeeFormModal.jsx';
import { deleteEmployee, fetchEmployees, saveEmployee } from '../store/adminEmployeeSlice.js';
import { fetchAdminHotels } from '../store/adminHotelSlice.js';
import { formatDate, formatMoney } from '../../core/format.js';

export default function EmployeesManager() {
  const dispatch = useDispatch();
  const { items, status, saving } = useSelector((s) => s.adminEmployees);
  const hotels = useSelector((s) => s.adminHotels.items);
  const [hotelId, setHotelId] = useState('');
  const [designation, setDesignation] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { dispatch(fetchAdminHotels()); }, [dispatch]);
  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { dispatch(fetchEmployees({ hotelId, designation, search: debounced })); }, [dispatch, hotelId, designation, debounced]);

  const openForm = (employee = null) => { setEditing(employee); setFormOpen(true); };

  const onSave = async (payload) => {
    const result = await dispatch(saveEmployee(payload));
    if (saveEmployee.fulfilled.match(result)) { toast.success(payload.id ? 'Employee updated' : 'Employee added'); setFormOpen(false); } else toast.error(result.payload);
  };

  const onDelete = async () => {
    const result = await dispatch(deleteEmployee(toDelete.id));
    if (deleteEmployee.fulfilled.match(result)) toast.success(`${toDelete.name} removed`); else toast.error(result.payload);
    setToDelete(null);
  };

  const activeCount = items.filter((e) => e.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold text-ocean">Employees</h1><p className="mt-1 text-ink/60">{activeCount} working · {items.length - activeCount} inactive</p></div>
        <button className="btn-brass" onClick={() => openForm()} disabled={!hotels.length}><Plus size={16} /> Add employee</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="field !w-60" value={hotelId} onChange={(e) => setHotelId(e.target.value)} aria-label="Filter by hotel">
          <option value="">All hotels</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select className="field !w-48" value={designation} onChange={(e) => setDesignation(e.target.value)} aria-label="Filter by designation">
          <option value="">All designations</option>
          {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input className="field !w-64" placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employees" />
      </div>

      {status === 'loading' && !items.length ? <div className="skeleton h-64" /> : !items.length ? (
        <EmptyState icon={UserRound} title="No employees found" text={hotelId || designation || search ? 'Try clearing the filters.' : 'Add your first staff member.'} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-mist text-xs font-semibold text-ink/55">
              <tr><th className="px-6 py-3">Employee</th><th className="px-3 py-3">Designation</th><th className="px-3 py-3">Hotel</th><th className="px-3 py-3">Phone</th><th className="px-3 py-3">Salary</th><th className="px-3 py-3">Joined</th><th className="px-3 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className={`border-t border-ocean/5 ${e.is_active ? '' : 'opacity-60'}`}>
                  <td className="px-6 py-3"><p className="font-semibold text-ocean">{e.name}</p><p className="text-xs text-ink/55">{e.email || '—'}</p></td>
                  <td className="px-3 py-3">{e.designation}</td>
                  <td className="px-3 py-3"><p>{e.hotel_name}</p><p className="text-xs text-ink/55">{e.hotel_city}</p></td>
                  <td className="px-3 py-3">{e.phone || '—'}</td>
                  <td className="px-3 py-3">{e.salary != null ? formatMoney(e.salary) : '—'}</td>
                  <td className="px-3 py-3">{formatDate(e.joined_on)}</td>
                  <td className="px-3 py-3">{e.is_active ? <span className="text-xs font-semibold text-moss">Working</span> : <span className="text-xs font-semibold text-coral">Inactive</span>}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-ghost !px-3 !py-1.5" onClick={() => openForm(e)}><Pencil size={14} /> Edit</button>
                      <button className="btn-ghost !px-3 !py-1.5 !text-coral" onClick={() => setToDelete(e)} aria-label={`Remove ${e.name}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeFormModal open={formOpen} employee={editing} hotels={hotels} defaultHotelId={hotelId} saving={saving} onClose={() => setFormOpen(false)} onSave={onSave} />

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Remove this employee?" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setToDelete(null)}>Keep</button><button className="btn-danger" onClick={onDelete}>Remove</button></>}>
        <p className="text-sm text-ink/70">{toDelete?.name} will be permanently deleted. To keep their record, edit them and untick “Currently working” instead.</p>
      </Modal>
    </div>
  );
}
