import { query } from '../config/db.js';

const ACTIVE_STATUSES = "('pending','confirmed','checked_in')";

const BASE_SELECT = `SELECT r.*, h.name AS hotel_name, h.city AS hotel_city
  FROM rooms r LEFT JOIN hotels h ON h.id = r.hotel_id`;

const normalize = (row) => {
  if (!row) return null;
  let amenities = row.amenities;
  if (typeof amenities === 'string') {
    try { amenities = JSON.parse(amenities); } catch { amenities = []; }
  }
  return { ...row, amenities: amenities ?? [], is_ac: Boolean(row.is_ac), is_active: Boolean(row.is_active) };
};

export const RoomModel = {
  async list(filters = {}) {
    const { type, hotelId, ac, minPrice, maxPrice, guests, search, checkIn, checkOut, includeInactive } = filters;
    const where = [];
    const params = [];

    // Rooms of an archived hotel are hidden from the website too
    if (!includeInactive) where.push('r.is_active = 1', 'h.is_active = 1');
    if (hotelId) { where.push('r.hotel_id = ?'); params.push(Number(hotelId)); }
    if (ac === 'ac') where.push('r.is_ac = 1');
    if (ac === 'non_ac') where.push('r.is_ac = 0');
    if (type) { where.push('r.type = ?'); params.push(type); }
    if (minPrice) { where.push('r.price_per_night >= ?'); params.push(Number(minPrice)); }
    if (maxPrice) { where.push('r.price_per_night <= ?'); params.push(Number(maxPrice)); }
    if (guests) { where.push('r.capacity >= ?'); params.push(Number(guests)); }
    if (search) { where.push('(r.name LIKE ? OR r.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (checkIn && checkOut) {
      where.push(`NOT EXISTS (
        SELECT 1 FROM bookings b
         WHERE b.room_id = r.id AND b.status IN ${ACTIVE_STATUSES}
           AND b.check_in < ? AND b.check_out > ?)`);
      params.push(checkOut, checkIn);
    }

    const rows = await query(
      `${BASE_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY h.name ASC, r.price_per_night ASC`,
      params,
    );
    return rows.map(normalize);
  },

  async findById(id) {
    const rows = await query(`${BASE_SELECT} WHERE r.id = ? LIMIT 1`, [id]);
    return normalize(rows[0]);
  },

  async create(data) {
    const result = await query(
      `INSERT INTO rooms (hotel_id, name, type, description, price_per_night, capacity, is_ac, size_sqft, amenities, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.hotel_id, data.name, data.type, data.description ?? null, data.price_per_night, data.capacity ?? 2, data.is_ac === false ? 0 : 1,
        data.size_sqft ?? null, JSON.stringify(data.amenities ?? []), data.image_url ?? null],
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const map = ['hotel_id', 'name', 'type', 'description', 'price_per_night', 'capacity', 'is_ac', 'size_sqft', 'image_url', 'is_active'];
    map.forEach((key) => {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(['is_active', 'is_ac'].includes(key) ? (data[key] ? 1 : 0) : data[key]); }
    });
    if (data.amenities !== undefined) { fields.push('amenities = ?'); params.push(JSON.stringify(data.amenities)); }
    if (fields.length) await query(`UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    return this.findById(id);
  },

  // Soft delete keeps booking history intact
  async archive(id) {
    await query('UPDATE rooms SET is_active = 0 WHERE id = ?', [id]);
  },

  async count() {
    const rows = await query('SELECT COUNT(*) AS total FROM rooms WHERE is_active = 1');
    return rows[0].total;
  },
};
