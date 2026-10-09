import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Building2, CalendarPlus, CalendarX2, Inbox, KeyRound, LogOut, Menu, MessageSquareHeart, Search, AlignLeft } from 'lucide-react';
import { notificationsCleared, notificationsRead } from '../store/notificationSlice.js';

const NOTI_ICONS = { booking: CalendarPlus, cancel: CalendarX2, feedback: MessageSquareHeart, enquiry: Inbox };

const timeAgo = (ts) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.round(mins / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
};

/** Closes a dropdown on outside click or Escape. */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return { open, setOpen, ref };
}

const panel = 'absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-md bg-white shadow-[0_0_3px_rgba(0,0,0,.15)]';

export default function AdminHeader({ collapsed, onToggle, onOpenMobile, onLogout }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.adminAuth.user);
  const { items, unread } = useSelector((s) => s.notifications);
  const { socketConnected, online } = useSelector((s) => s.dashboard);
  const noti = useDropdown();
  const account = useDropdown();
  const [query, setQuery] = useState('');
  const initials = (user?.name || 'A').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const search = (e) => {
    e.preventDefault();
    navigate(`/admin/bookings${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`);
  };

  const toggleNoti = () => { noti.setOpen((v) => !v); if (unread) dispatch(notificationsRead()); };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-20 items-center border-b border-[#edf2f9] bg-[#f9fbfd] pr-3 print:hidden">
      {/* Logo block (same width as the sidebar) */}
      <Link to="/admin" className={`hidden h-full shrink-0 items-center gap-2 bg-white px-5 transition-[width] duration-300 lg:flex ${collapsed ? 'w-[78px] justify-center' : 'w-[260px]'}`} aria-label="Harbourline admin home">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ocean text-white"><Building2 size={22} aria-hidden="true" /></span>
        {!collapsed && <span className="text-[23px] font-semibold text-ocean">Harbourline</span>}
      </Link>

      <button type="button" onClick={onToggle} className="ml-4 hidden rounded p-2 text-[#333] hover:text-ocean lg:block" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <AlignLeft size={22} />
      </button>
      <button type="button" onClick={onOpenMobile} className="ml-2 rounded p-2 text-[#333] lg:hidden" aria-label="Open menu"><Menu size={24} /></button>
      <Link to="/admin" className="ml-1 text-xl font-semibold text-ocean lg:hidden">Harbourline</Link>

      <form onSubmit={search} role="search" className="relative ml-6 hidden md:block">
        <label htmlFor="admin-search" className="sr-only">Search bookings</label>
        <input id="admin-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bookings"
          className="h-10 w-64 rounded-full border border-ocean bg-ocean py-2 pl-4 pr-11 text-sm text-white placeholder:text-white/80 focus:outline-none focus:ring-4 focus:ring-ocean/25 xl:w-80" />
        <button type="submit" className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/15" aria-label="Search"><Search size={16} /></button>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <span className="mr-2 hidden items-center gap-2 text-xs font-medium text-ink/60 sm:flex" role="status">
          <span className={`h-2 w-2 rounded-full ${socketConnected ? 'animate-pulse-dot bg-moss' : 'bg-coral'}`} />
          {socketConnected ? `Live · ${online} online` : 'Reconnecting…'}
        </span>

        {/* Notifications */}
        <div className="relative" ref={noti.ref}>
          <button type="button" onClick={toggleNoti} aria-expanded={noti.open} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#333] hover:bg-black/5">
            <Bell size={20} />
            {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
          </button>
          <AnimatePresence>
            {noti.open && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`${panel} w-[340px] max-w-[calc(100vw-24px)]`}>
                <div className="flex items-center justify-between border-b border-[#eee] px-4 py-3">
                  <span className="font-semibold text-[#333]">Notifications</span>
                  {items.length > 0 && <button type="button" onClick={() => dispatch(notificationsCleared())} className="text-sm text-coral hover:underline">Clear All</button>}
                </div>
                <ul className="max-h-[290px] overflow-y-auto">
                  {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink/55">No new activity this session. New bookings, feedback and enquiries appear here.</li>}
                  {items.map((n) => {
                    const Icon = NOTI_ICONS[n.type] || Bell;
                    return (
                      <li key={n.id} className="border-b border-[#f5f5f5] last:border-0">
                        <Link to={n.to} onClick={() => noti.setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-[#fafafa]">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-ocean"><Icon size={15} aria-hidden="true" /></span>
                          <span className="min-w-0">
                            <span className="block text-sm text-[#989c9e]"><span className="font-medium text-[#333]">{n.title}</span> {n.text}</span>
                            <span className="text-xs text-[#bdbdbd]">{timeAgo(n.at)}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link to="/admin/bookings" onClick={() => noti.setOpen(false)} className="block border-t border-[#eee] py-2.5 text-center text-sm text-ocean hover:bg-[#fafafa]">View all bookings</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Account */}
        <div className="relative" ref={account.ref}>
          <button type="button" onClick={() => account.setOpen((v) => !v)} aria-expanded={account.open} aria-label="Account menu"
            className="flex h-10 items-center gap-2 rounded-full pl-1 pr-2 hover:bg-black/5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean text-xs font-semibold text-white">{initials}</span>
          </button>
          <AnimatePresence>
            {account.open && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`${panel} w-56`}>
                <div className="flex items-center gap-3 border-b border-[#eee] bg-[#f9f9f9] px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean text-xs font-semibold text-white">{initials}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#333]">{user?.name}</p><p className="text-xs text-ink/55">Administrator</p></div>
                </div>
                <Link to="/admin/change-password" onClick={() => account.setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#333] hover:bg-[#f7f7f7]"><KeyRound size={15} /> Change Password</Link>
                <button type="button" onClick={() => { account.setOpen(false); onLogout(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-coral hover:bg-[#f7f7f7]"><LogOut size={15} /> Logout</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
