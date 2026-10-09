import { Check } from 'lucide-react';

const STEPS = ['Cart', 'Checkout', 'Payment', 'Confirmation'];

/** Progress indicator for the booking flow. `current` is the 0-based active step. */
export default function CheckoutSteps({ current }) {
  return (
    <ol className="mb-10 flex items-center gap-2 text-xs font-semibold sm:gap-4 sm:text-sm" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3" aria-current={active ? 'step' : undefined}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${done ? 'bg-moss text-white' : active ? 'bg-ocean text-white' : 'bg-ocean/10 text-ink/50'}`}>
              {done ? <Check size={14} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`hidden sm:inline ${active ? 'text-ocean' : 'text-ink/55'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? 'bg-moss' : 'bg-ocean/15'}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
