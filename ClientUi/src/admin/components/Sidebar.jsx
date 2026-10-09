import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BedDouble, Briefcase, Building2, ChevronRight, ExternalLink, Gauge, Inbox, KeyRound, LogOut, MessageSquareHeart, User, Users,
} from 'lucide-react';

export const MENU = [
  { to: '/admin', label: 'Dashboard', icon: Gauge, end: true },
  { divider: true },
  { label: 'Booking', icon: Briefcase, children: [{ to: '/admin/bookings', label: 'All Booking' }, { to: '/admin/invoices', label: 'Invoices' }] },
  { to: '/admin/users', label: 'Customers', icon: User },
  { to: '/admin/hotels', label: 'Hotels', icon: Building2 },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquareHeart },
  { to: '/admin/enquiries', label: 'Enquiry', icon: Inbox },
  { divider: true },
  { title: 'Account' },
  { to: '/admin/change-password', label: 'Change Password', icon: KeyRound },
];

const itemBase = 'flex h-11 items-center gap-3 rounded-lg px-4 text-[15px] transition';
const itemIdle = 'text-[#333] hover:text-ocean';
const itemActive = 'bg-ocean text-white shadow-[0_7px_12px_0_rgba(95,118,232,.21)]';

function Submenu({ item, mini }) {
  const { pathname } = useLocation();
  const childActive = item.children.some((c) => pathname.startsWith(c.to));
  const [open, setOpen] = useState(childActive);
  useEffect(() => { if (childActive) setOpen(true); }, [childActive]);
  const Icon = item.icon;

  return (
    <li>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} title={mini ? item.label : undefined}
        className={`${itemBase} w-full ${childActive ? itemActive : itemIdle}`}>
        <Icon size={19} className="shrink-0" aria-hidden="true" />
        <span className={`flex-1 text-left ${mini ? 'sr-only' : ''}`}>{item.label}</span>
        {!mini && <ChevronRight size={16} aria-hidden="true" className={`transition-transform ${open ? 'rotate-90' : ''}`} />}
      </button>
      <AnimatePresence initial={false}>
        {open && !mini && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <ul className="relative ml-[38px] mt-1 border-l border-[#dfdfdf]">
              {item.children.map((c) => (
                <li key={c.to}>
                  <NavLink to={c.to}
                    className={({ isActive }) => `relative block py-2 pl-[17px] text-sm before:absolute before:-left-[5px] before:top-[13px] before:h-2.5 before:w-2.5 before:rounded-full before:border-2 before:bg-white ${isActive ? 'text-ocean before:border-ocean' : 'text-[#333] before:border-[#333] hover:text-ocean'}`}>
                    {c.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Menu({ mini, onLogout }) {
  return (
    <nav aria-label="Admin" className="py-4 pl-3 pr-4">
      <ul className="space-y-1">
        {MENU.map((item, i) => {
          if (item.divider) return <li key={`d${i}`} aria-hidden="true" className="!my-3 h-px bg-[#edf2f9]" />;
          if (item.title) return mini ? null : <li key={item.title} className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#333]">{item.title}</li>;
          if (item.children) return <Submenu key={item.label} item={item} mini={mini} />;
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} title={mini ? item.label : undefined} className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}>
                <Icon size={19} className="shrink-0" aria-hidden="true" /><span className={mini ? 'sr-only' : ''}>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={onLogout} title={mini ? 'Logout' : undefined} className={`${itemBase} w-full text-coral hover:bg-coral-100`}>
            <LogOut size={19} className="shrink-0" aria-hidden="true" /><span className={mini ? 'sr-only' : ''}>Logout</span>
          </button>
        </li>
        <li>
          <a href="/" target="_blank" rel="noreferrer" title={mini ? 'View website' : undefined} className={`${itemBase} ${itemIdle}`}>
            <ExternalLink size={19} className="shrink-0" aria-hidden="true" /><span className={mini ? 'sr-only' : ''}>View Website</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}

/**
 * Desktop: fixed white sidebar under the 80px header; `collapsed` shrinks it to icons (expands while hovered).
 * Mobile: off-canvas drawer.
 */
export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, onLogout }) {
  const [hovered, setHovered] = useState(false);
  const mini = collapsed && !hovered;

  return (
    <>
      <aside onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={`fixed bottom-0 left-0 top-20 z-40 hidden overflow-y-auto overflow-x-hidden bg-white transition-[width] duration-300 lg:block print:!hidden ${mini ? 'w-[78px]' : 'w-[260px]'} ${collapsed && hovered ? 'shadow-xl' : ''}`}>
        <Menu mini={mini} onLogout={onLogout} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
            <motion.div className="absolute inset-y-0 left-0 w-[260px] overflow-y-auto bg-white" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
              <p className="flex h-20 items-center gap-2 border-b border-[#edf2f9] px-6 text-[23px] font-semibold text-ocean"><Building2 aria-hidden="true" /> Harbourline</p>
              <Menu mini={false} onLogout={onLogout} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
