import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, Maximize2, ShoppingBag, Users } from 'lucide-react';
import PageLoader from '../../components/ui/PageLoader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { checkRoomAvailability, fetchRoomById } from '../store/roomSlice.js';
import { cartItemAdded, MAX_CART_ITEMS, overlapsCart } from '../store/cartSlice.js';
import { formatMoney, nightsBetween, todayISO } from '../../core/format.js';
import AcBadge from '../../components/ui/AcBadge.jsx';

export default function RoomDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: room, detailStatus } = useSelector((s) => s.webRooms);
  const cart = useSelector((s) => s.webCart.items);

  const [form, setForm] = useState({
    checkIn: params.get('checkIn') || todayISO(1),
    checkOut: params.get('checkOut') || todayISO(3),
    guests: Number(params.get('guests')) || 2,
  });
  const [available, setAvailable] = useState(null); // null = checking

  useEffect(() => { dispatch(fetchRoomById(id)); }, [dispatch, id]);

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const total = nights * (room?.price_per_night || 0);

  useEffect(() => {
    if (!room || nights < 1) { setAvailable(null); return undefined; }
    setAvailable(null);
    const timer = setTimeout(() => {
      dispatch(checkRoomAvailability({ id, checkIn: form.checkIn, checkOut: form.checkOut, guests: form.guests }))
        .unwrap().then(setAvailable).catch(() => setAvailable(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, id, room, nights, form.checkIn, form.checkOut, form.guests]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const stay = room && { room_id: room.id, check_in: form.checkIn, check_out: form.checkOut, guests: Number(form.guests) };
  const inCart = Boolean(stay && overlapsCart(cart, stay));

  /** Adds this stay to the cart; returns false (with a message) when it can't be added. */
  const addToCart = () => {
    if (inCart) { toast('This room is already in your cart for overlapping dates'); return false; }
    if (cart.length >= MAX_CART_ITEMS) { toast.error(`Your cart can hold up to ${MAX_CART_ITEMS} rooms`); return false; }
    dispatch(cartItemAdded({
      ...stay,
      room_name: room.name, room_type: room.type, room_image: room.image_url, is_ac: room.is_ac, capacity: room.capacity,
      hotel_name: room.hotel_name, hotel_city: room.hotel_city, price_per_night: Number(room.price_per_night),
    }));
    return true;
  };

  const onAdd = () => { if (addToCart()) toast.success(`${room.name} added to your cart`); };
  const onBookNow = () => { if (inCart || addToCart()) navigate('/checkout'); };

  if (detailStatus === 'loading' || (detailStatus === 'idle' && !room)) return <PageLoader label="Loading room" />;
  if (!room) return <div className="mx-auto max-w-xl px-5 py-20"><EmptyState title="Room not found" text="It may have been removed." action={<Link to="/rooms" className="btn-primary">Back to rooms</Link>} /></div>;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link to="/rooms" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ocean-500 hover:text-ocean"><ArrowLeft size={16} /> All rooms</Link>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-ocean-100 shadow-lift">
            {room.image_url && <img src={room.image_url} alt={room.name} className="h-full w-full object-cover" />}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-ocean px-3 py-1 text-xs font-semibold capitalize text-white">{room.type}</span>
            <AcBadge isAc={room.is_ac} />
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60"><Users size={15} /> Up to {room.capacity} guests</span>
            {room.size_sqft && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60"><Maximize2 size={15} /> {room.size_sqft} sq ft</span>}
          </div>
          {room.hotel_name && <p className="mt-3 text-sm font-semibold text-ocean-500">{room.hotel_name}{room.hotel_city ? ` · ${room.hotel_city}` : ''}</p>}
          <h1 className="mt-1 text-4xl font-semibold text-ocean">{room.name}</h1>
          <p className="mt-4 max-w-prose leading-relaxed text-ink/70">{room.description}</p>

          <h2 className="mt-10 text-2xl font-semibold text-ocean">What’s in the room</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {room.amenities.map((a) => (
              <li key={a} className="flex items-center gap-3 text-sm font-medium text-ink/75">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-moss-100 text-moss"><Check size={14} /></span>{a}
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p><span className="font-display text-3xl font-bold text-ocean">{formatMoney(room.price_per_night)}</span> <span className="text-sm text-ink/50">/ night</span></p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="ci">Check-in</label><input id="ci" type="date" className="field" min={todayISO()} value={form.checkIn} onChange={set('checkIn')} /></div>
              <div><label className="label" htmlFor="co">Check-out</label><input id="co" type="date" className="field" min={form.checkIn} value={form.checkOut} onChange={set('checkOut')} /></div>
            </div>
            <div className="mt-3">
              <label className="label" htmlFor="gs">Guests</label>
              <select id="gs" className="field" value={form.guests} onChange={set('guests')}>
                {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
              </select>
            </div>

            <div className="mt-5 space-y-2 border-t border-ocean/10 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-ink/60">{formatMoney(room.price_per_night)} × {nights || 0} nights</span><span className="font-semibold">{formatMoney(total)}</span></div>
              <div className="flex justify-between text-base"><span className="font-semibold text-ocean">Total</span><span className="font-display text-xl font-bold text-ocean">{formatMoney(total)}</span></div>
            </div>

            <p className={`mt-4 flex items-center gap-2 text-sm font-semibold ${available === false ? 'text-coral' : available ? 'text-moss' : 'text-ink/50'}`} role="status">
              {available === null && nights >= 1 && <><Spinner /> Checking those dates…</>}
              {available === true && <><Check size={16} /> Free for your dates</>}
              {available === false && 'Already booked for these dates. Try different dates.'}
              {nights < 1 && 'Check-out must be after check-in.'}
            </p>

            <div className="mt-4 grid gap-3">
              <button className="btn-brass w-full" onClick={onBookNow} disabled={nights < 1 || available !== true}>Book now</button>
              {inCart ? (
                <Link to="/cart" className="btn-ghost w-full"><ShoppingBag size={16} /> In your cart · view cart</Link>
              ) : (
                <button className="btn-ghost w-full" onClick={onAdd} disabled={nights < 1 || available !== true}><ShoppingBag size={16} /> Add to cart</button>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-ink/50">Pay securely at checkout. Free cancellation until 48 hours before check-in.</p>
          </div>
        </aside>
      </div>

    </div>
  );
}
