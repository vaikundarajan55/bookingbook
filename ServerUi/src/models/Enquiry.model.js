import { query } from '../config/db.js';

const BASE_SELECT = `SELECT q.*, h.name AS hotel_name
  FROM enquiries q LEFT JOIN hotels h ON h.id = q.hotel_id`;

export const EnquiryModel = {
  async list({ status, search } = {}) {
    const where = ['1=1'];
    const params = [];
    if (status) { where.push('q.status = ?'); params.push(status); }
    if (search) { where.push('(q.name LIKE ? OR q.email LIKE ? OR q.subject LIKE ?)'); params.push(...Array(3).fill(`%${search}%`)); }
    return query(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY q.created_at DESC`, params);
  },

  async findById(id) {
    const rows = await query(`${BASE_SELECT} WHERE q.id = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
  },

  async create({ name, email, phone, hotelId, subject, message }) {
    const result = await query(
      'INSERT INTO enquiries (name, email, phone, hotel_id, subject, message) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, hotelId || null, subject, message],
    );
    return this.findById(result.insertId);
  },

  async setStatus(id, status) {
    await query('UPDATE enquiries SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  },

  async remove(id) {
    await query('DELETE FROM enquiries WHERE id = ?', [id]);
  },
};
