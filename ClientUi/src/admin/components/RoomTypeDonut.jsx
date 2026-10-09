import { useState } from 'react';

// Fixed order, validated with the dataviz palette checker (CVD + normal-vision separation pass on white).
// Yellow is below 3:1 against white, so every slice is also labelled with its count and share in the legend.
const TYPES = [
  { type: 'standard', label: 'Standard', color: '#009688' },
  { type: 'deluxe', label: 'Deluxe', color: '#eb6834' },
  { type: 'suite', label: 'Suite', color: '#2a78d6' },
  { type: 'family', label: 'Family', color: '#eda100' },
];

const SIZE = 200;
const R = 80;
const STROKE = 28;
const C = 2 * Math.PI * R;
const GAP = 2; // 2px surface gap between segments

/** Part-to-whole of (non-cancelled) bookings by room type. */
export default function RoomTypeDonut({ data = [] }) {
  const [active, setActive] = useState(null);
  const counts = Object.fromEntries(data.map((d) => [d.type, d.bookings]));
  const rows = TYPES.map((t) => ({ ...t, value: counts[t.type] || 0 }));
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);

  let offset = 0;
  const segments = rows.filter((r) => r.value > 0).map((r) => {
    const len = (r.value / total) * C;
    const seg = { ...r, dash: Math.max(len - (rows.filter((x) => x.value).length > 1 ? GAP : 0), 0.5), offset };
    offset += len;
    return seg;
  });
  const focus = active ? rows.find((r) => r.type === active) : null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
      <figure className="relative h-[200px] w-[200px] shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90" role="img"
          aria-label={total ? `Bookings by room type: ${rows.map((r) => `${r.label} ${r.value}`).join(', ')}` : 'No bookings yet'}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#eef1f5" strokeWidth={STROKE} />
          {segments.map((s) => (
            <circle key={s.type} cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={s.color}
              strokeWidth={active === s.type ? STROKE + 6 : STROKE} strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={-s.offset}
              className="cursor-pointer transition-[stroke-width] duration-150"
              onMouseEnter={() => setActive(s.type)} onMouseLeave={() => setActive(null)} />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold text-[#333]">{focus ? focus.value : total}</span>
          <span className="text-xs text-ink/60">{focus ? `${focus.label} · ${pct(focus.value)}%` : 'bookings'}</span>
        </div>
      </figure>

      <ul className="min-w-[200px] max-w-[240px] flex-1 space-y-1 text-sm" aria-label="Legend">
        {rows.map((r) => (
          <li key={r.type}>
            <button type="button" onMouseEnter={() => setActive(r.type)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(r.type)} onBlur={() => setActive(null)}
              className={`flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition ${active === r.type ? 'bg-mist' : ''}`}>
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: r.color }} aria-hidden="true" />
              <span className="flex-1 text-[#333]">{r.label}</span>
              <span className="font-semibold text-[#333]">{r.value}</span>
              <span className="w-10 text-right text-ink/55">{pct(r.value)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
