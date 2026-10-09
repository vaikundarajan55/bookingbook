import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Anchor, ArrowRight, ArrowUp, Clock, Mail, MapPin, Phone } from 'lucide-react';
import usePublicHotels from '../hooks/usePublicHotels.js';

const ease = [0.22, 1, 0.36, 1];
const columns = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const column = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } };

const explore = [
  ['/rooms', 'All rooms'],
  ['/cart', 'Your cart'],
  ['/feedback', 'Leave feedback'],
  ['/contact', 'Contact us'],
];
const guestLinks = [
  ['/account', 'My dashboard'],
  ['/account/bookings', 'Manage a booking'],
  ['/account/profile', 'Profile'],
];
const visitorLinks = [
  ['/login', 'Sign in'],
  ['/register', 'Create account'],
  ['/forgot-password', 'Forgot password'],
];

/** Footer link: slides right and reveals an arrow on hover / focus. */
function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="group inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white focus-visible:text-white">
        <ArrowRight size={13} aria-hidden="true" className="-ml-5 opacity-0 transition-all duration-300 group-hover:ml-0 group-hover:opacity-100 group-focus-visible:ml-0 group-focus-visible:opacity-100" />
        <span className="transition-transform duration-300">{children}</span>
      </Link>
    </li>
  );
}

function Waves() {
  return (
    <div className="pointer-events-none relative -mb-px h-16 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 flex w-[200%] animate-wave-slow text-ocean-500 opacity-30">
        {[0, 1].map((i) => <svg key={i} viewBox="0 0 1200 100" preserveAspectRatio="none" className="h-16 w-1/2 fill-current"><path d="M0 50 C150 0 350 100 600 50 S1050 0 1200 50 V100 H0Z" /></svg>)}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex w-[200%] animate-wave text-ocean-800 opacity-80">
        {[0, 1].map((i) => <svg key={i} viewBox="0 0 1200 100" preserveAspectRatio="none" className="h-12 w-1/2 fill-current"><path d="M0 60 C200 20 400 90 600 60 S1000 20 1200 60 V100 H0Z" /></svg>)}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex w-[200%] animate-wave-slow text-ocean-950 [animation-direction:reverse]">
        {[0, 1].map((i) => <svg key={i} viewBox="0 0 1200 100" preserveAspectRatio="none" className="h-8 w-1/2 fill-current"><path d="M0 70 C250 40 450 95 700 65 S1050 45 1200 70 V100 H0Z" /></svg>)}
      </div>
    </div>
  );
}

export default function Footer() {
  const user = useSelector((s) => s.webAuth.user);
  const [hotel] = usePublicHotels();
  const toTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  return (
    <footer className="mt-20 print:hidden">
      <Waves />
      <div className="bg-ocean-950 text-ocean-200">
        {/* Call to action */}
        <div className="mx-auto max-w-6xl px-5 pt-10">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, ease }}
            className="relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-ocean-800 to-ocean-700 p-8 sm:flex-row sm:items-center">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 animate-float rounded-full bg-brass/15 blur-2xl" aria-hidden="true" />
            <div className="relative">
              <p className="font-display text-2xl font-semibold text-white sm:text-3xl">Ready for a stay by the harbour?</p>
              <p className="mt-1 text-sm text-ocean-200">Pick your dates and your room is held the moment you check out.</p>
            </div>
            <div className="relative flex flex-wrap gap-3">
              <Link to="/rooms" className="btn-brass group relative overflow-hidden">
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
                Book a room <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link to="/contact" className="btn border border-white/25 text-white hover:bg-white/10">Contact us</Link>
            </div>
          </motion.div>
        </div>

        <motion.div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]"
          variants={columns} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <motion.div variants={column}>
            <Link to="/" className="group inline-flex items-center gap-2 font-display text-2xl font-bold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass text-ocean-950 transition-transform duration-500 group-hover:rotate-[18deg]"><Anchor size={18} aria-hidden="true" /></span>
              Harbourline Hotel
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">Rooms on the marina, booked directly with us. AC and non-AC rooms, families welcome, and free cancellation until 48 hours before check-in.</p>
          </motion.div>

          <motion.div variants={column}>
            <p className="mb-4 text-sm font-semibold text-white">Explore</p>
            <ul className="space-y-2.5">{explore.map(([to, label]) => <FooterLink key={to} to={to}>{label}</FooterLink>)}</ul>
          </motion.div>

          <motion.div variants={column}>
            <p className="mb-4 text-sm font-semibold text-white">{user ? 'Your account' : 'Account'}</p>
            <ul className="space-y-2.5">{(user ? guestLinks : visitorLinks).map(([to, label]) => <FooterLink key={to} to={to}>{label}</FooterLink>)}</ul>
          </motion.div>

          <motion.div variants={column}>
            <p className="mb-4 text-sm font-semibold text-white">Front desk</p>
            <ul className="space-y-3 text-sm">
              {hotel?.address && <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-brass" aria-hidden="true" />{hotel.address}, {hotel.city}</li>}
              {hotel?.phone && <li className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-brass" aria-hidden="true" /><a href={`tel:${hotel.phone.replace(/\s/g, '')}`} className="hover:text-white">{hotel.phone}</a></li>}
              <li className="flex gap-3"><Mail size={16} className="mt-0.5 shrink-0 text-brass" aria-hidden="true" /><a href="mailto:stay@harbourline.example" className="hover:text-white">stay@harbourline.example</a></li>
              <li className="flex gap-3"><Clock size={16} className="mt-0.5 shrink-0 text-brass" aria-hidden="true" />Open 24 hours · check-in 2 pm, check-out 11 am</li>
            </ul>
          </motion.div>
        </motion.div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-ocean-200/80">
            <p>© {new Date().getFullYear()} Harbourline Hotel. Demo application.</p>
            <button type="button" onClick={toTop} className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-semibold text-white transition hover:border-brass hover:bg-white/5">
              Back to top
              <ArrowUp size={14} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-1" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
