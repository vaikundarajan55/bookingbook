import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import useCountUp from '../../core/useCountUp.js';

export const kpiItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * KPI tile: coloured top edge, tinted icon, optional sparkline/meter (`visual`), count-up value and a trend chip.
 * `format` turns the animated number into text; `trend` is a % change (positive = good unless `inverse`).
 */
export default function KpiCard({ icon: Icon, label, value, format = (n) => Math.round(n).toLocaleString('en-US'), accent, visual, trend, trendLabel, caption, inverse = false }) {
  const animated = useCountUp(value);
  const hasTrend = Number.isFinite(trend);
  const good = hasTrend && (inverse ? trend <= 0 : trend >= 0);
  const TrendIcon = hasTrend && trend < 0 ? TrendingDown : TrendingUp;

  return (
    <motion.div variants={kpiItem} className="card relative overflow-hidden p-5" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}1f`, color: accent }}>
          <Icon size={19} aria-hidden="true" />
        </span>
        {visual && <div className="h-10 w-28 shrink-0">{visual}</div>}
      </div>
      <p className="mt-4 text-sm text-ink/65">{label}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink tabular-nums" aria-label={`${label}: ${format(value)}`}>{format(animated)}</p>
        {hasTrend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${good ? 'text-moss' : 'text-coral'}`}>
            <TrendIcon size={14} aria-hidden="true" /> {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {(caption || trendLabel) && <p className="mt-1 text-xs text-ink/55">{caption || trendLabel}</p>}
    </motion.div>
  );
}
