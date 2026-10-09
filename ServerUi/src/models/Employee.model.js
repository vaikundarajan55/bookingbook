import { query } from '../config/db.js';

const FIELDS = ['hotel_id', 'name', 'designation', 'email', 'phone', 'salary', 'joined_on'];

const BASE_SELECT = `SELECT e.*, h.name AS hotel_name, h.city AS hotel_city
  FROM employees e JOIN hotels h ON h.id = e.hotel_id`;

const normalize = (row) => (row ? { ...row, is_active: Boolean(row.is_active) } : null);

export const EmployeeModel = {
  async list({ hotelId, search, designation } = {}) {
    const where = ['1=1'];
    const params = [];
    if (hotelId) { where.push('e.hotel_id = ?'); params.push(Number(hotelId)); }
    if (designation) { where.push('e.designation = ?'); params.push(designation); }
    if (search) { where.push('(e.name LIKE ? OR e.email LIKE ? OR e.phone LIKE ?)'); params.push(...Array(3).fill(`%${search}%`)); }
    const rows = await query(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY h.name ASC, e.name ASC`, params);
    return rows.map(normalize);
  },

  async findById(id) {
    const rows = await query(`${BASE_SELECT} WHERE e.id = ? LIMIT 1`, [id]);
    return normalize(rows[0]);
  },

  async create(data) {
    const result = await query(
      `INSERT INTO employees (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`,
      FIELDS.map((key) => data[key] ?? null),
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    [...FIELDS, 'is_active'].forEach((key) => {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]); }
    });
    if (fields.length) await query(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    return this.findById(id);
  },

  async remove(id) {
    await query('DELETE FROM employees WHERE id = ?', [id]);
  },
};
