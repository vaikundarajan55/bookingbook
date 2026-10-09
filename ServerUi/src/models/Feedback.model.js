import { query } from '../config/db.js';

const BASE_SELECT = `SELECT f.*, u.name AS guest_name, u.email AS guest_email, h.name AS hotel_name
  FROM feedback f
  JOIN users u ON u.id = f.user_id
  LEFT JOIN hotels h ON h.id = f.hotel_id`;

export const FeedbackModel = {
  async list({ status, hotelId, rating } = {}) {
    const where = ['1=1'];
    const params = [];
    if (status) { where.push('f.status = ?'); params.push(status); }
    if (hotelId) { where.push('f.hotel_id = ?'); params.push(Number(hotelId)); }
    if (rating) { where.push('f.rating = ?'); params.push(Number(rating)); }
    return query(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY f.created_at DESC`, params);
  },

  async findById(id) {
    const rows = await query(`${BASE_SELECT} WHERE f.id = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
  },

  async create({ userId, hotelId, rating, comment }) {
    const result = await query(
      'INSERT INTO feedback (user_id, hotel_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, hotelId ?? null, rating, comment],
    );
    return this.findById(result.insertId);
  },

  async setStatus(id, status) {
    await query('UPDATE feedback SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  },

  async remove(id) {
    await query('DELETE FROM feedback WHERE id = ?', [id]);
  },
};
