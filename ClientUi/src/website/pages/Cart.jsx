import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShoppingBag, Trash2 } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState.jsx';
import AcBadge from '../../components/ui/AcBadge.jsx';
import CheckoutSteps from '../components/CheckoutSteps.jsx';
import { cartCleared, cartItemRemoved, lineTotal } from '../store/cartSlice.js';
import { formatDate, formatMoney, nightsBetween, todayISO } from '../../core/format.js';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((s) => s.webCart.items);
  const today = todayISO();
  const expired = items.filter((i) => i.check_in < today);
  const total = items.reduce((sum, i) => sum + lineTotal(i), 0);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <CheckoutSteps current={0} />
        <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Pick your dates on any room and choose “Add to cart”. You can book several rooms in one go."
          action={<Link to="/rooms" className="btn-primary">Browse rooms</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <CheckoutSteps current={0} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ocean">Your cart</h1>
        <button className="text-sm font-semibold text-coral hover:underline" onClick={() => dispatch(cartCleared())}>Empty cart</button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const nights = nightsBetween(item.check_in, item.check_out);
              const past = item.check_in < today;
              return (
                <motion.li key={item.key} layout exit={{ opacity: 0, x: -30 }} className={`card flex flex-col overflow-hidden sm:flex-row ${past ? 'ring-2 ring-coral/40' : ''}`}>
                  <Link to={`/rooms/${item.room_id}`} className="block h-40 w-full shrink-0 bg-ocean-100 sm:h-auto sm:w-44">
                    {item.room_image && <img src={item.room_image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      {item.hotel_name && <p className="text-xs font-semibold text-ocean-500">{item.hotel_name}{item.hotel_city ? ` · ${item.hotel_city}` : ''}</p>}
                      <h2 className="text-lg font-semibold text-ocean">{item.room_name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/70">
                        <span className="capitalize">{item.room_type}</span><AcBadge isAc={item.is_ac} />
                      </div>
                      <p className="mt-2 text-sm text-ink/75">{formatDate(item.check_in)} → {formatDate(item.check_out)} · {nights} night{nights > 1 ? 's' : ''} · {item.guests} guest{item.guests > 1 ? 's' : ''}</p>
                      {past && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-coral"><AlertTriangle size={15} /> These dates have passed. Remove it and pick new dates.</p>}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <p className="text-right"><span className="font-display text-xl font-bold text-ocean">{formatMoney(lineTotal(item))}</span><span className="block text-xs text-ink/50">{formatMoney(item.price_per_night)} / night</span></p>
                      <button className="btn-ghost !px-3 !py-1.5 !text-xs !text-coral" onClick={() => dispatch(cartItemRemoved(item.key))} aria-label={`Remove ${item.room_name} from cart`}><Trash2 size={14} /> Remove</button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-ocean">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              {items.map((i) => <div key={i.key} className="flex justify-between gap-3"><dt className="truncate text-ink/60">{i.room_name}</dt><dd className="font-semibold">{formatMoney(lineTotal(i))}</dd></div>)}
              <div className="flex justify-between border-t border-ocean/10 pt-3 text-base"><dt className="font-semibold text-ocean">Total</dt><dd className="font-display text-2xl font-bold text-ocean">{formatMoney(total)}</dd></div>
            </dl>
            <p className="mt-1 text-right text-xs text-ink/50">Taxes included</p>
            <button className="btn-brass mt-5 w-full" disabled={expired.length > 0} onClick={() => navigate('/checkout')}>Proceed to checkout</button>
            <Link to="/rooms" className="mt-3 block text-center text-sm font-semibold text-ocean-500 hover:underline">Add another room</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
