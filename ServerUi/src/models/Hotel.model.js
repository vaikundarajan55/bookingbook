import { query } from '../config/db.js';

const FIELDS = ['name', 'city', 'address', 'phone', 'star_rating', 'description', 'image_url'];

const normalize = (row) => (row ? { ...row, is_active: Boolean(row.is_active) } : null);

export const HotelModel = {
  async list({ includeInactive = false, search = '' } = {}) {
    const where = [];
    const params = [];
    if (!includeInactive) where.push('h.is_active = 1');
    if (search) { where.push('(h.name LIKE ? OR h.city LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const rows = await query(
      `SELECT h.*,
              COUNT(r.id) AS rooms_count,
              COALESCE(SUM(r.is_ac = 1), 0) AS ac_rooms_count,
              COALESCE(SUM(r.is_ac = 0), 0) AS non_ac_rooms_count
         FROM hotels h
         LEFT JOIN rooms r ON r.hotel_id = h.id AND r.is_active = 1
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        GROUP BY h.id
        ORDER BY h.name ASC`,
      params,
    );
    return rows.map((row) => ({
      ...normalize(row),
      rooms_count: Number(row.rooms_count),
      ac_rooms_count: Number(row.ac_rooms_count),
      non_ac_rooms_count: Number(row.non_ac_rooms_count),
    }));
  },

  async findById(id) {
    const rows = await query('SELECT * FROM hotels WHERE id = ? LIMIT 1', [id]);
    return normalize(rows[0]);
  },

  async create(data) {
    const result = await query(
      `INSERT INTO hotels (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`,
      FIELDS.map((key) => data[key] ?? (key === 'star_rating' ? 3 : null)),
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    [...FIELDS, 'is_active'].forEach((key) => {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]); }
    });
    if (fields.length) await query(`UPDATE hotels SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    return this.findById(id);
  },

  // Soft delete: the hotel and its rooms disappear from the website, bookings stay intact
  async archive(id) {
    await query('UPDATE hotels SET is_active = 0 WHERE id = ?', [id]);
  },
};
