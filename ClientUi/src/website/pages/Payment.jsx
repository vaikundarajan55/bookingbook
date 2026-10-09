import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CreditCard, Landmark, Lock, Smartphone } from 'lucide-react';
import PageLoader from '../../components/ui/PageLoader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import CheckoutSteps from '../components/CheckoutSteps.jsx';
import TestPaymentPanel, { testExpiry } from '../components/TestPaymentPanel.jsx';
import { fetchMyBookings } from '../store/bookingSlice.js';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';
import { formatDate, formatMoney } from '../../core/format.js';

const METHODS = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'netbanking', label: 'Net banking', icon: Landmark },
];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'];

const digits = (v) => v.replace(/\D/g, '');
const groupCard = (v) => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
/** Brand from the leading digits, shown next to the card number. */
const cardBrand = (num) => {
  if (/^4/.test(num)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'Amex';
  if (/^(6011|65|64[4-9])/.test(num)) return 'Discover';
  if (/^(60|81|82|508)/.test(num)) return 'RuPay';
  return '';
};
/** Luhn checksum: catches mistyped card numbers before submitting. */
const luhn = (num) => {
  let sum = 0;
  [...num].reverse().forEach((d, i) => {
    let n = Number(d);
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  });
  return num.length >= 12 && sum % 10 === 0;
};

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const bookings = useSelector((s) => s.webBookings.items);
  const [loaded, setLoaded] = useState(false); // wait for a fresh list: the store may hold one from before checkout
  const ids = useMemo(() => (params.get('bookings') || '').split(',').map(Number).filter(Boolean), [params]);
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState(BANKS[0]);
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);

  useEffect(() => { dispatch(fetchMyBookings()).finally(() => setLoaded(true)); }, [dispatch]);

  const selected = bookings.filter((b) => ids.includes(b.id));
  const payable = selected.filter((b) => b.status !== 'cancelled' && b.payment_status !== 'paid');
  const total = payable.reduce((sum, b) => sum + Number(b.total_price), 0);

  const validateForm = () => {
    const found = {};
    if (method === 'card') {
      const num = digits(card.number);
      if (!luhn(num)) found.number = 'Check the card number';
      if (card.name.trim().length < 2) found.name = 'Enter the name on the card';
      const [mm, yy] = card.expiry.split('/').map(Number);
      const now = new Date();
      const expiryEnd = new Date(2000 + (yy || 0), mm || 0, 1); // first day of the month after expiry
      if (!mm || mm > 12 || !yy || expiryEnd <= now) found.expiry = 'Enter a valid, unexpired date (MM/YY)';
      if (!/^\d{3,4}$/.test(card.cvv)) found.cvv = '3 or 4 digits';
    }
    if (method === 'upi' && !/^[\w.-]+@[\w]+$/.test(upi.trim())) found.upi = 'Enter a UPI ID like name@bank';
    setErrors(found);
    return !Object.keys(found).length;
  };

  const pay = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setPaying(true);
    try {
      // Only the last 4 digits ever leave the browser
      const body = { booking_ids: payable.map((b) => b.id), method };
      if (method === 'card') body.card_last4 = digits(card.number).slice(-4);
      if (method === 'upi') body.upi_id = upi.trim();
      if (method === 'netbanking') body.bank = bank;
      const { data } = await webApi.post('/payments', body);
      dispatch(fetchMyBookings());
      navigate(`/payment/${data.data.status === 'success' ? 'success' : 'failed'}?ref=${data.data.reference}`, { replace: true });
    } catch (err) {
      setErrors({ form: getErrorMessage(err) });
    } finally {
      setPaying(false);
    }
  };

  if (!ids.length) return <div className="mx-auto max-w-xl px-5 py-20"><EmptyState title="Nothing to pay" text="Choose a booking to pay from your account." action={<Link to="/account/bookings" className="btn-primary">My bookings</Link>} /></div>;
  if (!loaded) return <PageLoader label="Loading your booking" />;
  if (!payable.length) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <EmptyState title="Already settled" text={selected.length ? 'These bookings are already paid or were cancelled.' : 'We could not find these bookings on your account.'}
          action={<Link to="/account/bookings" className="btn-primary">My bookings</Link>} />
      </div>
    );
  }

  const fieldError = (key) => errors[key] && <p className="mt-1 text-xs font-medium text-coral">{errors[key]}</p>;
  const setCardField = (key, value) => setCard((c) => ({ ...c, [key]: value }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <CheckoutSteps current={2} />
      <h1 className="text-4xl font-semibold text-ocean">Payment</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={pay} className="card p-6" noValidate>
          <div role="tablist" aria-label="Payment method" className="grid grid-cols-3 gap-2 rounded-2xl bg-mist p-1.5">
            {METHODS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={method === id} onClick={() => { setMethod(id); setErrors({}); }}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${method === id ? 'bg-white text-ocean shadow' : 'text-ink/60 hover:text-ocean'}`}>
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {method === 'card' && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label" htmlFor="pc-num">Card number</label>
                    {cardBrand(digits(card.number)) && <span className="mb-1.5 rounded bg-ocean-100 px-2 py-0.5 text-xs font-semibold text-ocean">{cardBrand(digits(card.number))}</span>}
                  </div>
                  <input id="pc-num" inputMode="numeric" autoComplete="cc-number" className="field" placeholder="1234 5678 9012 3456" maxLength={23}
                    value={card.number} onChange={(e) => setCardField('number', groupCard(e.target.value))} />
                  {fieldError('number')}</div>
                <div><label className="label" htmlFor="pc-name">Name on card</label>
                  <input id="pc-name" autoComplete="cc-name" className="field" value={card.name} onChange={(e) => setCardField('name', e.target.value)} />{fieldError('name')}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label" htmlFor="pc-exp">Expiry</label>
                    <input id="pc-exp" inputMode="numeric" autoComplete="cc-exp" className="field" placeholder="MM/YY" maxLength={5}
                      value={card.expiry} onChange={(e) => { const d = digits(e.target.value).slice(0, 4); setCardField('expiry', d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }} />
                    {fieldError('expiry')}</div>
                  <div><label className="label" htmlFor="pc-cvv">CVV</label>
                    <input id="pc-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" className="field" maxLength={4} value={card.cvv} onChange={(e) => setCardField('cvv', digits(e.target.value))} />
                    {fieldError('cvv')}</div>
                </div>
              </>
            )}
            {method === 'upi' && (
              <div><label className="label" htmlFor="pu-id">UPI ID</label>
                <input id="pu-id" className="field" placeholder="yourname@okbank" value={upi} onChange={(e) => setUpi(e.target.value)} />{fieldError('upi')}
                <p className="mt-2 text-xs text-ink/55">You’ll approve the request in your UPI app.</p></div>
            )}
            {method === 'netbanking' && (
              <div><label className="label" htmlFor="pn-bank">Your bank</label>
                <select id="pn-bank" className="field" value={bank} onChange={(e) => setBank(e.target.value)}>
                  {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  <option value="FAIL">Test bank (always fails)</option>
                </select></div>
            )}
          </div>

          <TestPaymentPanel method={method}
            onUseCard={(c) => { setErrors({}); setCard({ number: groupCard(c.number), name: 'Test User', expiry: testExpiry(), cvv: c.cvv || '123' }); }}
            onUseUpi={(id) => { setErrors({}); setUpi(id); }} />

          {errors.form && <p className="mt-4 rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{errors.form}</p>}
          <button type="submit" className="btn-brass mt-6 w-full" disabled={paying}>{paying ? <Spinner /> : <Lock size={16} />} Pay {formatMoney(total)}</button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-ocean">You’re paying for</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {payable.map((b) => (
                <li key={b.id} className="flex justify-between gap-3">
                  <span><span className="block font-semibold text-ocean">{b.room_name}</span><span className="text-ink/55">{b.reference} · {formatDate(b.check_in)}</span></span>
                  <span className="font-semibold">{formatMoney(b.total_price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-ocean/10 pt-3"><span className="font-semibold text-ocean">Total</span><span className="font-display text-2xl font-bold text-ocean">{formatMoney(total)}</span></div>
            <p className="mt-3 text-xs text-ink/55">Your rooms are already held. If you leave now you can pay later from My bookings.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
