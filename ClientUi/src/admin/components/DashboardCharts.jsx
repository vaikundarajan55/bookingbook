import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { formatMoney } from '../../core/format.js';

// Series colours, validated with the dataviz palette checker on white (CVD + normal-vision separation pass).
export const SERIES = { booked: '#009688', collected: '#eb6834', bookings: '#2a78d6', occupancy: '#c98500' };

const monthLabel = (key, opts = { month: 'short' }) => new Date(`${key}-01T00:00:00`).toLocaleString('en-GB', opts);
const draw = { hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1.1, ease: 'easeInOut' } } };

/**
 * Monotone cubic (Fritsch–Carlson) smoothing: a soft curve through every point that never
 * overshoots between them, so the line never shows a peak or dip that isn't in the data.
 */
const smoothPath = (pts) => {
  const n = pts.length;
  if (n < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const dx = []; const slope = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; slope[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
  const t = [slope[0]];
  for (let i = 1; i < n - 1; i++) t[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  t[n - 1] = slope[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / slope[i]; const b = t[i + 1] / slope[i]; const h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * slope[i]; t[i + 1] = k * b * slope[i]; }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1]; const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`;
  }
  return d;
};

const niceMax = (v) => {
  if (v <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((m) => m >= v);
};
const compactMoney = (n) => (n >= 1000 ? `$${Math.round(n / 100) / 10}K` : formatMoney(n));

/** Tiny trend line for KPI cards (decorative: the card's number carries the value). */
export function Sparkline({ values, color }) {
  const id = useId();
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 36 - (v / max) * 32]);
  const line = smoothPath(pts);
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.25" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <motion.path d={`${line} L100,40 L0,40 Z`} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" variants={draw} initial="hidden" animate="show" />
    </svg>
  );
}

/** Ratio against a limit: a same-hue track. */
export function Meter({ value, color }) {
  return (
    <div className="flex h-full flex-col justify-center" aria-hidden="true">
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: `${color}26` }}>
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
      </div>
    </div>
  );
}

const W = 720;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 30, left: 56 };

/** Two money series over 12 months: smooth lines + soft areas, crosshair and tooltip on hover / focus. */
export function BookedVsCollectedChart({ series }) {
  const [active, setActive] = useState(null);
  const max = niceMax(Math.max(...series.flatMap((s) => [s.booked, s.collected])));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (innerW * i) / (series.length - 1);
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const lines = ['booked', 'collected'].map((key) => {
    const line = smoothPath(series.map((s, i) => [x(i), y(s[key])]));
    return { key, line, area: `${line} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z` };
  });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const hit = innerW / (series.length - 1);
  const a = active != null ? series[active] : null;
  const shift = active === 0 ? '0%' : active === series.length - 1 ? '-100%' : '-50%';

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={`Booked and collected per month: ${series.map((s) => `${monthLabel(s.month)} booked ${formatMoney(s.booked)}, collected ${formatMoney(s.collected)}`).join('; ')}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e9ecef" strokeDasharray={t ? '4 4' : undefined} />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink/60 text-[12px]">{compactMoney(t)}</text>
          </g>
        ))}
        {series.map((s, i) => <text key={s.month} x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink/60 text-[12px]">{monthLabel(s.month)}</text>)}

        {lines.map(({ key, area }) => (
          <motion.path key={`${key}-area`} d={area} fill={SERIES[key]} fillOpacity={key === 'booked' ? 0.1 : 0.08} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />
        ))}
        {lines.map(({ key, line }) => (
          <motion.path key={key} d={line} fill="none" stroke={SERIES[key]} strokeWidth="2.5" strokeLinecap="round" variants={draw} initial="hidden" animate="show" />
        ))}

        {a && (
          <>
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} stroke="rgb(var(--ink))" strokeOpacity="0.2" />
            {['booked', 'collected'].map((key) => (
              <circle key={key} cx={x(active)} cy={y(a[key])} r="5" fill={SERIES[key]} stroke="#fff" strokeWidth="2" />
            ))}
          </>
        )}
        {series.map((s, i) => (
          <rect key={s.month} x={x(i) - hit / 2} y={PAD.top} width={hit} height={innerH} fill="transparent" tabIndex={0}
            aria-label={`${monthLabel(s.month, { month: 'long', year: 'numeric' })}: booked ${formatMoney(s.booked)}, collected ${formatMoney(s.collected)}`}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} />
        ))}
      </svg>

      {a && (
        <div className="pointer-events-none absolute top-2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm shadow-[0_4px_16px_rgba(0,0,0,.12)] ring-1 ring-black/5"
          style={{ left: `${(x(active) / W) * 100}%`, transform: `translate(${shift}, 0)` }}>
          <p className="text-xs text-ink/60">{monthLabel(a.month, { month: 'long', year: 'numeric' })}</p>
          <p className="mt-0.5 flex items-center gap-2 font-semibold text-ink"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES.booked }} />Booked: {formatMoney(a.booked)}</p>
          <p className="flex items-center gap-2 font-semibold text-ink"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES.collected }} />Collected: {formatMoney(a.collected)}</p>
          <p className="mt-0.5 text-xs text-ink/60">{a.bookings} bookings · {a.cancelled} cancelled</p>
        </div>
      )}
    </figure>
  );
}

/** Horizontal bars, one hue (magnitude), with the count printed at the end of each bar. */
export function HorizontalBars({ rows, color = SERIES.booked }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3" aria-label="Bookings by status">
      {rows.map((r, i) => (
        <li key={r.label} className="grid grid-cols-[88px_1fr_40px] items-center gap-3 text-sm">
          <span className="text-ink/70">{r.label}</span>
          <div className="h-6 overflow-hidden rounded bg-mist">
            <motion.div className="h-full rounded" style={{ backgroundColor: color }}
              initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.8, delay: 0.15 + i * 0.08, ease: 'easeOut' }} />
          </div>
          <span className="text-right font-semibold tabular-nums text-ink">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
