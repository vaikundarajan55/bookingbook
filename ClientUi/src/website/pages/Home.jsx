import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Anchor, Clock, Coffee, ShieldCheck } from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard.jsx';
import { fetchRooms } from '../store/roomSlice.js';
import { formatMoney } from '../../core/format.js';

const heroSequence = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const perks = [
  { icon: ShieldCheck, title: 'Free cancellation', text: 'Change your mind up to 48 hours before check-in at no cost.' },
  { icon: Coffee, title: 'Breakfast on the terrace', text: 'Served from 6:30 am over the water, included in every suite.' },
  { icon: Clock, title: 'Front desk all night', text: 'Land at 2 am? Someone will be there with your key.' },
  { icon: Anchor, title: 'Two minutes to the marina', text: 'Ferries, fish market and the seafront walk are on your doorstep.' },
];

export default function Home() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.webRooms);

  useEffect(() => { dispatch(fetchRooms({})); }, [dispatch]);

  const featured = items.slice(0, 3);
  const cheapest = items.length ? Math.min(...items.map((r) => r.price_per_night)) : null;

  return (
    <>
      <section className="relative overflow-hidden bg-ocean-950 text-white">
        <div className="absolute inset-0 opacity-60" aria-hidden="true"
          style={{ background: 'radial-gradient(60% 80% at 85% 20%, rgba(31,122,140,.55), transparent), radial-gradient(40% 60% at 5% 90%, rgba(200,164,77,.18), transparent)' }} />
        <motion.div variants={heroSequence} initial="hidden" animate="show" className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-36 pt-16 lg:grid-cols-[1.15fr_.85fr] lg:pt-24">
          <div>
            <motion.h1 variants={heroItem} className="text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Wake up with the harbour<br className="hidden sm:block" /> outside your window.
            </motion.h1>
            <motion.p variants={heroItem} className="mt-6 max-w-lg text-lg text-ocean-200">
              Forty-two rooms on the marina, booked directly with us. Pick your dates and see exactly what is free.
            </motion.p>
            <motion.div variants={heroItem} className="mt-9 max-w-2xl"><SearchBar /></motion.div>
          </div>

          <motion.div variants={heroItem} className="relative mx-auto hidden w-full max-w-sm lg:block">
            <div className="aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-3xl border-8 border-white/10 shadow-glass">
              <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900" alt="Harbourline Hotel terrace and pool" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -left-10 bottom-10 animate-float rounded-2xl bg-white p-4 text-ink shadow-glass">
              <p className="text-xs font-semibold text-ink/50">Rooms from</p>
              <p className="font-display text-2xl font-bold text-ocean">{cheapest ? formatMoney(cheapest) : '—'}<span className="text-xs font-sans font-medium text-ink/50"> / night</span></p>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden text-mist" aria-hidden="true">
          <div className="flex w-[200%] animate-wave-slow opacity-40">
            {[0, 1].map((i) => (
              <svg key={i} viewBox="0 0 1200 100" preserveAspectRatio="none" className="h-24 w-1/2 fill-current"><path d="M0 50 C150 0 350 100 600 50 S1050 0 1200 50 V100 H0Z" /></svg>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex w-[200%] animate-wave">
            {[0, 1].map((i) => (
              <svg key={i} viewBox="0 0 1200 100" preserveAspectRatio="none" className="h-16 w-1/2 fill-current"><path d="M0 60 C200 20 400 90 600 60 S1000 20 1200 60 V100 H0Z" /></svg>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-ocean">Rooms guests ask for first</h2>
            <p className="mt-1 text-ink/60">A quiet standard, a corner deluxe and a two-room suite.</p>
          </div>
          <Link to="/rooms" className="btn-ghost">See all rooms</Link>
        </div>
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate={status === 'succeeded' ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {status !== 'succeeded' ? [0, 1, 2].map((i) => <RoomCardSkeleton key={i} />) : featured.map((room) => <RoomCard key={room.id} room={room} />)}
        </motion.div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5">
        <h2 className="max-w-md text-3xl font-semibold text-ocean">Booking direct means fewer surprises</h2>
        <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ocean text-brass"><Icon size={20} /></span>
              <div>
                <dt className="text-lg font-semibold text-ocean">{title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink/65">{text}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
