import { STATUS_STYLES, statusLabel } from '../../core/format.js';

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] || ''}`}>
      {statusLabel(status)}
    </span>
  );
}
