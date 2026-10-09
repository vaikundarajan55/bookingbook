import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BedDouble } from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { fetchRooms } from '../store/roomSlice.js';
import { formatDate, nightsBetween } from '../../core/format.js';

const TYPES = ['', 'standard', 'deluxe', 'suite', 'family'];

export default function Rooms() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const { items, status, error } = useSelector((s) => s.webRooms);
  const [search, setSearch] = useState(params.get('search') || '');

  const filters = useMemo(() => ({
    type: params.get('type') || '',
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: params.get('guests') || '',
    maxPrice: params.get('maxPrice') || '',
    search: params.get('search') || '',
  }), [params]);

  useEffect(() => { dispatch(fetchRooms(filters)); }, [dispatch, filters]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const hasDates = filters.checkIn && filters.checkOut;
  const carry = hasDates ? `?${new URLSearchParams({ checkIn: filters.checkIn, checkOut: filters.checkOut, guests: filters.guests || 2 })}` : '';

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl font-semibold text-ocean">Our rooms</h1>
      <p className="mt-2 text-ink/60">
        {hasDates
          ? `Free for ${nightsBetween(filters.checkIn, filters.checkOut)} nights, ${formatDate(filters.checkIn)} to ${formatDate(filters.checkOut)}.`
          : 'Add dates to see only the rooms that are free.'}
      </p>

      <SearchBar className="mt-6" initial={filters} key={`${filters.checkIn}${filters.checkOut}${filters.guests}`} />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Room type">
          {TYPES.map((t) => (
            <button key={t || 'all'} onClick={() => update({ type: t })}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${filters.type === t ? 'bg-ocean text-white' : 'bg-white text-ocean ring-1 ring-ocean/10 hover:bg-ocean-100'}`}>
              {t || 'All types'}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); update({ search }); }} className="ml-auto flex gap-2">
          <input className="field !w-48" placeholder="Search rooms" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search rooms" />
          <select className="field !w-40" value={filters.maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} aria-label="Maximum price">
            <option value="">Any price</option>
            <option value="150">Up to 150</option>
            <option value="250">Up to 250</option>
            <option value="400">Up to 400</option>
          </select>
        </form>
      </div>

      <div className="mt-8">
        {status === 'failed' && <EmptyState icon={BedDouble} title="Rooms couldn’t be loaded" text={error} />}
        {status === 'loading' && !items.length && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <RoomCardSkeleton key={i} />)}</div>
        )}
        {status === 'succeeded' && items.length === 0 && (
          <EmptyState icon={BedDouble} title="No rooms free for these filters"
            text="Try different dates, fewer guests or a higher price limit."
            action={<button className="btn-primary" onClick={() => setParams({}, { replace: true })}>Clear filters</button>} />
        )}
        {items.length > 0 && (
          <motion.div key={JSON.stringify(filters)} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
            {items.map((room) => <RoomCard key={room.id} room={room} search={carry} />)}
          </motion.div>
        )}
      </div>
    </div>
  );
}
