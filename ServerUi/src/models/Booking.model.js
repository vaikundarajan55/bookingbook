import { pool, query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const BASE_SELECT = `
  SELECT b.*, r.name AS room_name, r.type AS room_type, r.image_url AS room_image, r.is_ac AS room_is_ac, r.hotel_id,
         h.name AS hotel_name, h.city AS hotel_city, h.address AS hotel_address, h.phone AS hotel_phone,
         u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
    FROM bookings b
    JOIN rooms r ON r.id = b.room_id
    LEFT JOIN hotels h ON h.id = r.hotel_id
    JOIN users u ON u.id = b.user_id`;

const makeReference = () => `HB${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export const nightsBetween = (checkIn, checkOut) =>
  Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);

export const BookingModel = {
  async findById(id) {
    const rows = await query(`${BASE_SELECT} WHERE b.id = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
  },

  async listByUser(userId) {
    return query(`${BASE_SELECT} WHERE b.user_id = ? ORDER BY b.created_at DESC`, [userId]);
  },

  async listAll({ status, search, hotelId, paymentStatus, excludeCancelled } = {}) {
    const where = ['1=1'];
    const params = [];
    if (status) { where.push('b.status = ?'); params.push(status); }
    if (excludeCancelled) where.push("b.status <> 'cancelled'");
    if (hotelId) { where.push('r.hotel_id = ?'); params.push(Number(hotelId)); }
    if (paymentStatus) { where.push('b.payment_status = ?'); params.push(paymentStatus); }
    if (search) {
      where.push('(b.reference LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR r.name LIKE ?)');
      params.push(...Array(4).fill(`%${search}%`));
    }
    return query(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY b.created_at DESC`, params);
  },

  /** Creates a booking inside a transaction and row-locks the room to avoid double booking. */
  async create(item) {
    const [booking] = await this.createMany([item]);
    return booking;
  },

  /**
   * Creates several bookings (a checkout cart) in ONE transaction: all succeed or none do.
   * Each room row is locked, so two guests can never book the same room for overlapping dates,
   * and a cart cannot contain two overlapping stays in the same room either.
   */
  async createMany(items) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const ids = [];
      for (const { userId, roomId, checkIn, checkOut, guests, notes } of items) {
        const [rooms] = await conn.query(
          `SELECT r.* FROM rooms r JOIN hotels h ON h.id = r.hotel_id
            WHERE r.id = ? AND r.is_active = 1 AND h.is_active = 1 FOR UPDATE`,
          [roomId],
        );
        const room = rooms[0];
        if (!room) throw ApiError.notFound('Room not found');
        if (guests > room.capacity) throw ApiError.badRequest(`${room.name} sleeps up to ${room.capacity} guests`);

        const [clash] = await conn.query(
          `SELECT id FROM bookings
            WHERE room_id = ? AND status IN ('pending','confirmed','checked_in')
              AND check_in < ? AND check_out > ? LIMIT 1`,
          [roomId, checkOut, checkIn],
        );
        if (clash.length) throw ApiError.conflict(`${room.name} is already booked for ${checkIn} to ${checkOut}`);

        const total = nightsBetween(checkIn, checkOut) * Number(room.price_per_night);
        const [result] = await conn.query(
          `INSERT INTO bookings (reference, user_id, room_id, check_in, check_out, guests, total_price, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [makeReference(), userId, roomId, checkIn, checkOut, guests, total, notes ?? null],
        );
        ids.push(result.insertId);
      }
      await conn.commit();
      return Promise.all(ids.map((id) => this.findById(id)));
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** Bookings owned by the user that can still be paid (not cancelled, not already paid). */
  async findPayable(userId, ids) {
    if (!ids.length) return [];
    return query(
      `${BASE_SELECT} WHERE b.user_id = ? AND b.id IN (?) AND b.status <> 'cancelled' AND b.payment_status = 'unpaid'`,
      [userId, ids],
    );
  },

  async markPaid(ids, method, paymentRef) {
    await query(
      "UPDATE bookings SET payment_status = 'paid', payment_method = ?, paid_at = NOW(), payment_ref = ? WHERE id IN (?)",
      [method, paymentRef, ids],
    );
    return Promise.all(ids.map((id) => this.findById(id)));
  },

  async setPayment(id, paymentStatus, method) {
    await query(
      'UPDATE bookings SET payment_status = ?, payment_method = ?, paid_at = ? WHERE id = ?',
      paymentStatus === 'paid' ? ['paid', method, new Date(), id] : ['unpaid', null, null, id],
    );
    return this.findById(id);
  },

  async updateStatus(id, status) {
    await query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  },

  /**
   * Last 12 calendar months, oldest first, with zero-filled gaps:
   * booked = value of non-cancelled bookings made that month, collected = payments received that month.
   */
  async monthlySeries() {
    const since = "DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)";
    const made = await query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             SUM(status <> 'cancelled') AS bookings,
             SUM(status = 'cancelled') AS cancelled,
             COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total_price END), 0) AS booked
        FROM bookings WHERE created_at >= ${since} GROUP BY month`);
    const paid = await query(`
      SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month, COALESCE(SUM(total_price), 0) AS collected
        FROM bookings WHERE payment_status = 'paid' AND paid_at >= ${since} GROUP BY month`);
    const byMonth = (rows) => Object.fromEntries(rows.map((r) => [r.month, r]));
    const m = byMonth(made);
    const p = byMonth(paid);
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        month: key,
        bookings: Number(m[key]?.bookings ?? 0),
        cancelled: Number(m[key]?.cancelled ?? 0),
        booked: Number(m[key]?.booked ?? 0),
        collected: Number(p[key]?.collected ?? 0),
      };
    });
  },

  async stats() {
    const [counts] = await query(`
      SELECT COUNT(*) AS total,
             SUM(status = 'pending') AS pending,
             SUM(status = 'confirmed') AS confirmed,
             SUM(status = 'checked_in') AS checked_in,
             SUM(status = 'checked_out') AS checked_out,
             SUM(status = 'cancelled') AS cancelled
        FROM bookings`);
    const series = await this.monthlySeries();
    const [money] = await query(`
      SELECT COALESCE(SUM(CASE WHEN status <> 'cancelled' AND payment_status = 'unpaid' THEN total_price END), 0) AS outstanding,
             COALESCE(SUM(CASE WHEN status = 'cancelled' THEN total_price END), 0) AS cancelled_value,
             COALESCE(AVG(CASE WHEN status <> 'cancelled' THEN total_price END), 0) AS avg_value
        FROM bookings`);
    const [revenue] = await query(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings WHERE status IN ('confirmed','checked_in','checked_out')",
    );
    const [occupied] = await query(
      "SELECT COUNT(DISTINCT room_id) AS total FROM bookings WHERE status IN ('confirmed','checked_in') AND check_in <= CURDATE() AND check_out > CURDATE()",
    );
    const monthly = await query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total_price), 0) AS revenue, COUNT(*) AS bookings
        FROM bookings
       WHERE status <> 'cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY month ORDER BY month`);
    const recent = await query(`${BASE_SELECT} ORDER BY b.created_at DESC LIMIT 6`);
    const [collected] = await query("SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings WHERE payment_status = 'paid'");
    const byRoomType = await query(`
      SELECT r.type, COUNT(*) AS bookings
        FROM bookings b JOIN rooms r ON r.id = b.room_id
       WHERE b.status <> 'cancelled'
       GROUP BY r.type`);
    return {
      counts: {
        total: Number(counts.total), pending: Number(counts.pending ?? 0), confirmed: Number(counts.confirmed ?? 0),
        checked_in: Number(counts.checked_in ?? 0), checked_out: Number(counts.checked_out ?? 0), cancelled: Number(counts.cancelled ?? 0),
      },
      series,
      outstanding: Number(money.outstanding),
      cancelledValue: Number(money.cancelled_value),
      avgBookingValue: Math.round(Number(money.avg_value)),
      revenue: Number(revenue.total),
      collections: Number(collected.total),
      byRoomType: byRoomType.map((row) => ({ type: row.type, bookings: Number(row.bookings) })),
      occupiedToday: Number(occupied.total),
      monthly,
      recent,
    };
  },
};
