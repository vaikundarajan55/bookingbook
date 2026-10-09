import { useState } from 'react';
import { Check, Copy, FlaskConical } from 'lucide-react';

// Dummy cards for the demo gateway. Numbers pass the card checksum; the outcome is decided by the
// last 4 digits on the server (ServerUi/src/controllers/payment.controller.js → CARD_FAILURES).
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', brand: 'Visa', result: 'Payment succeeds', ok: true },
  { number: '5555 5555 5555 4444', brand: 'Mastercard', result: 'Payment succeeds', ok: true },
  { number: '3782 8224 6310 005', brand: 'Amex', result: 'Payment succeeds (4-digit CVV)', ok: true, cvv: '1234' },
  { number: '6011 1111 1111 1117', brand: 'Discover', result: 'Payment succeeds', ok: true },
  { number: '4000 0000 0000 0002', brand: 'Visa', result: 'Declined by bank', ok: false },
  { number: '4000 0000 0000 9995', brand: 'Visa', result: 'Insufficient funds', ok: false },
  { number: '4000 0000 0000 0069', brand: 'Visa', result: 'Expired card', ok: false },
  { number: '4000 0000 0000 0127', brand: 'Visa', result: 'Incorrect CVV', ok: false },
  { number: '4000 0000 0000 0119', brand: 'Visa', result: 'Processing error', ok: false },
];

export const TEST_UPI = [
  { id: 'success@upi', result: 'Payment succeeds', ok: true },
  { id: 'fail@upi', result: 'UPI request declined', ok: false },
];

/** Any month in the future works; use December next year. */
export const testExpiry = () => `12/${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}`;

const Outcome = ({ ok, children }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ok ? 'bg-moss-100 text-moss' : 'bg-coral-100 text-coral'}`}>{children}</span>
);

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value.replace(/\s/g, '')); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked: the Use button still works */ }
  };
  return (
    <button type="button" onClick={copy} className="rounded p-1 text-ink/45 hover:bg-white hover:text-ocean" aria-label={`Copy ${label}`}>
      {copied ? <Check size={14} className="text-moss" /> : <Copy size={14} />}
    </button>
  );
}

/** Demo-mode helper on the payment page: lists dummy cards / UPI IDs and fills the form on "Use". */
export default function TestPaymentPanel({ method, onUseCard, onUseUpi }) {
  return (
    <section className="mt-6 rounded-xl border border-dashed border-brass/60 bg-brass-100/60 p-4" aria-label="Test payment details">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink/80">
        <FlaskConical size={16} className="text-brass-600" aria-hidden="true" /> Demo payment: no real money is taken
      </p>

      {method === 'card' && (
        <>
          <p className="mt-1 text-xs text-ink/65">Use any card below with expiry <strong>{testExpiry()}</strong> (any future date) and CVV <strong>123</strong> (Amex: <strong>1234</strong>). Name can be anything.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead className="text-ink/55"><tr><th className="py-1.5 pr-2 font-semibold">Card number</th><th className="py-1.5 pr-2 font-semibold">Brand</th><th className="py-1.5 pr-2 font-semibold">Result</th><th className="py-1.5" /></tr></thead>
              <tbody>
                {TEST_CARDS.map((c) => (
                  <tr key={c.number} className="border-t border-brass/25">
                    <td className="whitespace-nowrap py-1.5 pr-2 font-mono text-[13px] text-ink">{c.number} <CopyButton value={c.number} label={`card ${c.number}`} /></td>
                    <td className="py-1.5 pr-2 text-ink/70">{c.brand}</td>
                    <td className="py-1.5 pr-2"><Outcome ok={c.ok}>{c.result}</Outcome></td>
                    <td className="py-1.5 text-right"><button type="button" onClick={() => onUseCard(c)} className="rounded-lg bg-white px-2.5 py-1 font-semibold text-ocean ring-1 ring-ocean/15 hover:bg-ocean-100">Use</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {method === 'upi' && (
        <ul className="mt-3 space-y-2 text-xs">
          {TEST_UPI.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[13px] text-ink">{u.id}</span><Outcome ok={u.ok}>{u.result}</Outcome>
              <button type="button" onClick={() => onUseUpi(u.id)} className="rounded-lg bg-white px-2.5 py-1 font-semibold text-ocean ring-1 ring-ocean/15 hover:bg-ocean-100">Use</button>
            </li>
          ))}
          <li className="text-ink/60">Any other UPI ID in the form <code>name@bank</code> also succeeds.</li>
        </ul>
      )}

      {method === 'netbanking' && (
        <p className="mt-2 text-xs text-ink/65">Every listed bank succeeds. Choose <strong>Test bank (always fails)</strong> to see a failed payment.</p>
      )}
    </section>
  );
}
