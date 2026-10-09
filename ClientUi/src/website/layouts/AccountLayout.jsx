import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CalendarDays, KeyRound, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import LogoutModal from '../components/LogoutModal.jsx';

const LINKS = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/bookings', label: 'My bookings', icon: CalendarDays },
  { to: '/account/profile', label: 'Profile', icon: UserRound },
  { to: '/account/change-password', label: 'Change password', icon: KeyRound },
];

export default function AccountLayout() {
  const user = useSelector((s) => s.webAuth.user);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-5 py-10 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="min-w-0 print:hidden">
        <div className="card p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-ocean/10 pb-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean font-semibold text-white">{initials}</span>
            <div className="min-w-0"><p className="truncate font-semibold text-ocean">{user?.name}</p><p className="truncate text-xs text-ink/55">{user?.email}</p></div>
          </div>
          <nav aria-label="Account" className="mt-3 flex gap-1 overflow-x-auto lg:flex-col">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-ocean text-white' : 'text-ink/70 hover:bg-ocean/5 hover:text-ocean'}`}>
                <Icon size={17} aria-hidden="true" /> {label}
              </NavLink>
            ))}
            <button type="button" onClick={() => setConfirmLogout(true)} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-coral hover:bg-coral-100">
              <LogOut size={17} aria-hidden="true" /> Logout
            </button>
          </nav>
        </div>
      </aside>
      <section className="min-w-0"><Outlet /></section>
      <LogoutModal open={confirmLogout} onClose={() => setConfirmLogout(false)} />
    </div>
  );
}
