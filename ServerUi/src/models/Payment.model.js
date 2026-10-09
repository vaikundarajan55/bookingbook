import { query } from '../config/db.js';

const makeReference = () => `PAY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const normalize = (row) => (row ? { ...row, amount: Number(row.amount), booking_ids: row.booking_ids.split(',').map(Number) } : null);

export const PaymentModel = {
  async create({ userId, amount, method, status, failureReason, bookingIds, cardLast4 }) {
    const reference = makeReference();
    await query(
      `INSERT INTO payments (reference, user_id, amount, method, status, failure_reason, booking_ids, card_last4)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [reference, userId, amount, method, status, failureReason ?? null, bookingIds.join(','), cardLast4 ?? null],
    );
    return this.findByReference(reference);
  },

  async findByReference(reference) {
    const rows = await query('SELECT * FROM payments WHERE reference = ? LIMIT 1', [reference]);
    return normalize(rows[0]);
  },
};
