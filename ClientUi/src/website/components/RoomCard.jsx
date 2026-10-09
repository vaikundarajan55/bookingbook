import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Maximize2, Users } from 'lucide-react';
import { formatMoney } from '../../core/format.js';
import AcBadge from '../../components/ui/AcBadge.jsx';

export const roomItemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function RoomCard({ room, search = '' }) {
  return (
    <motion.article variants={roomItemVariants} className="card group flex flex-col overflow-hidden">
      <Link to={`/rooms/${room.id}${search}`} className="relative block aspect-[4/3] overflow-hidden bg-ocean-100">
        {room.image_url && (
          <img src={room.image_url} alt={room.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-ocean backdrop-blur">{room.type}</span>
          <AcBadge isAc={room.is_ac} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {room.hotel_name && <p className="text-xs font-semibold text-ocean-500">{room.hotel_name}{room.hotel_city ? ` · ${room.hotel_city}` : ''}</p>}
        <h3 className="text-xl font-semibold text-ocean">{room.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink/60">{room.description}</p>
        <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-ink/55">
          <span className="inline-flex items-center gap-1.5"><Users size={14} /> Up to {room.capacity}</span>
          {room.size_sqft && <span className="inline-flex items-center gap-1.5"><Maximize2 size={14} /> {room.size_sqft} sq ft</span>}
        </div>
        <div className="mt-auto flex items-end justify-between pt-5">
          <p><span className="font-display text-2xl font-bold text-ocean">{formatMoney(room.price_per_night)}</span> <span className="text-xs text-ink/50">/ night</span></p>
          <Link to={`/rooms/${room.id}${search}`} className="btn-primary !py-2">View room</Link>
        </div>
      </div>
    </motion.article>
  );
}

export const RoomCardSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="skeleton aspect-[4/3] !rounded-none" />
    <div className="space-y-3 p-5">
      <div className="skeleton h-6 w-2/3" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-10 w-1/2" />
    </div>
  </div>
);
