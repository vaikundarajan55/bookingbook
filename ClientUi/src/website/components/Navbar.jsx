import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { Anchor, CalendarDays, ChevronDown, KeyRound, LayoutDashboard, LogOut, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import LogoutModal from './LogoutModal.jsx';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/rooms', label: 'Rooms' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/contact', label: 'Contact' },
];

const accountLinks = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/bookings', label: 'My bookings', icon: CalendarDays },
  { to: '/account/profile', label: 'Profile', icon: UserRound },
  { to: '/account/change-password', label: 'Change password', icon: KeyRound },
];

const ease = [0.22, 1, 0.36, 1];
const navList = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } };
const navItem = { hidden: { opacity: 0, y: -8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };
const mobileList = { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } } };
const mobileItem = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease } } };

function CartLink({ count }) {
  return (
    <Link to="/cart" className="group relative flex h-10 w-10 items-center justify-center rounded-full text-ocean transition hover:bg-ocean/5" aria-label={`Cart, ${count} ${count === 1 ? 'room' : 'rooms'}`}>
      <ShoppingBag size={20} className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
      <AnimatePresence>
        {count > 0 && (
          // keyed by count: the badge pops every time a room is added or removed
          <motion.span key={count} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 text-[11px] font-bold text-ocean-950">
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

function Logo() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-xl font-bold text-ocean" aria-label="Harbourline Hotel home">
      <motion.span initial={{ rotate: -40, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.6, ease }}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-ocean text-brass transition-transform duration-500 group-hover:rotate-[18deg]">
        <Anchor size={17} aria-hidden="true" />
      </motion.span>
      <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        Harbourline<span className="text-brass-600"> Hotel</span>
      </motion.span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);
  const { user } = useSelector((s) => s.webAuth);
  const cartCount = useSelector((s) => s.webCart.items.length);
  const location = useLocation();
  const menuRef = useRef(null);

  // The bar stays fixed at the top while scrolling (mouse, Page Down, arrow keys); it only gets compact
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12));

  useEffect(() => { setOpen(false); setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const askLogout = () => { setOpen(false); setMenuOpen(false); setConfirmLogout(true); };

  return (
    <>
      <motion.header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 print:hidden ${scrolled ? 'border-ocean/10 bg-mist/90 shadow-[0_8px_30px_-12px_rgba(11,42,59,.25)]' : 'border-transparent bg-mist/70'}`}>
        <div className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 transition-[height] duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
          <Logo />

          <motion.nav className="hidden items-center gap-1 lg:flex" aria-label="Main" variants={navList} initial="hidden" animate="show" onMouseLeave={() => setHovered(null)}>
            {links.map((l) => (
              <motion.div key={l.to} variants={navItem} className="relative" onMouseEnter={() => setHovered(l.to)}>
                {/* Soft pill that glides between links under the pointer */}
                {hovered === l.to && <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-ocean/[0.06]" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <NavLink to={l.to} end={l.end} className={({ isActive }) => `relative block px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-ocean' : 'text-ink/60 hover:text-ocean'}`}>
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded bg-brass" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>

          <motion.div className="hidden items-center gap-2 whitespace-nowrap lg:flex" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.35, ease }}>
            <CartLink count={cartCount} />
            {user ? (
              <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-haspopup="menu"
                  className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-ocean transition hover:bg-ocean/5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean text-xs text-white ring-2 ring-transparent transition group-hover:ring-brass">{user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
                  {user.name.split(' ')[0]} <ChevronDown size={15} className={`transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div role="menu" initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18 }} style={{ transformOrigin: 'top right' }}
                      className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-white py-2 shadow-lift ring-1 ring-ocean/10">
                      {accountLinks.map(({ to, label, icon: Icon }, i) => (
                        <motion.div key={to} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
                          <Link to={to} role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink/75 transition hover:bg-mist hover:pl-5 hover:text-ocean"><Icon size={16} /> {label}</Link>
                        </motion.div>
                      ))}
                      <button type="button" role="menuitem" onClick={askLogout} className="flex w-full items-center gap-3 border-t border-ocean/10 px-4 py-2.5 text-left text-sm font-semibold text-coral transition hover:bg-coral-100 hover:pl-5"><LogOut size={16} /> Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Sign in</Link>
                <Link to="/register" className="btn-primary">Create account</Link>
              </>
            )}
          </motion.div>

          <div className="flex items-center gap-1 lg:hidden">
            <CartLink count={cartCount} />
            <button className="rounded-lg p-2 text-ocean" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={open ? 'x' : 'menu'} className="block" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  {open ? <X /> : <Menu />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}
              className="overflow-hidden border-t border-ocean/10 bg-mist lg:hidden" aria-label="Mobile">
              <motion.div className="flex flex-col gap-1 px-5 py-4" variants={mobileList} initial="hidden" animate="show">
                {links.map((l) => (
                  <motion.div key={l.to} variants={mobileItem}>
                    <NavLink to={l.to} end={l.end} className={({ isActive }) => `block rounded-lg px-3 py-3 text-base font-semibold hover:bg-ocean/5 ${isActive ? 'bg-ocean/[0.06] text-ocean' : 'text-ocean/80'}`}>{l.label}</NavLink>
                  </motion.div>
                ))}
                {user ? (
                  <>
                    <motion.p variants={mobileItem} className="mt-2 border-t border-ocean/10 px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">My account</motion.p>
                    {accountLinks.map(({ to, label, icon: Icon }) => (
                      <motion.div key={to} variants={mobileItem}>
                        <NavLink to={to} end className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold text-ocean hover:bg-ocean/5"><Icon size={18} /> {label}</NavLink>
                      </motion.div>
                    ))}
                    <motion.div variants={mobileItem}><button onClick={askLogout} className="btn-ghost mt-2 w-full !text-coral"><LogOut size={16} /> Logout</button></motion.div>
                  </>
                ) : (
                  <motion.div variants={mobileItem} className="mt-2 grid grid-cols-2 gap-3">
                    <Link to="/login" className="btn-ghost">Sign in</Link>
                    <Link to="/register" className="btn-primary">Join</Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Reading progress */}
        <motion.div className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brass" style={{ scaleX: progress }} aria-hidden="true" />
      </motion.header>
      {/* Outside the header: its backdrop-blur would trap a fixed-position modal */}
      <LogoutModal open={confirmLogout} onClose={() => setConfirmLogout(false)} />
    </>
  );
}
