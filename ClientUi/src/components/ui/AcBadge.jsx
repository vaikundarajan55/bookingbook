import { Fan, Snowflake } from 'lucide-react';

/** "AC" / "Non-AC" pill shown on rooms in the website and admin. */
export default function AcBadge({ isAc, className = '' }) {
  const Icon = isAc ? Snowflake : Fan;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isAc ? 'bg-ocean-100 text-ocean-700' : 'bg-brass-100 text-brass-600'} ${className}`}>
      <Icon size={12} aria-hidden="true" /> {isAc ? 'AC' : 'Non-AC'}
    </span>
  );
}
