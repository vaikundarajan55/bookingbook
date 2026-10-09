import { query } from '../config/db.js';

const publicFields = 'id, name, email, phone, role, is_active, created_at';

export const UserModel = {
  async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] ?? null;
  },

  async findById(id) {
    const rows = await query(`SELECT ${publicFields} FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
  },

  async create({ name, email, phone = null, passwordHash, role = 'guest' }) {
    const result = await query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, passwordHash, role],
    );
    return this.findById(result.insertId);
  },

  async list({ search = '', role = '' } = {}) {
    const where = ['1=1'];
    const params = [];
    if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (role) { where.push('role = ?'); params.push(role); }
    return query(
      `SELECT u.${publicFields.split(', ').join(', u.')},
              (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) AS bookings_count
         FROM users u WHERE ${where.join(' AND ')} ORDER BY u.created_at DESC`,
      params,
    );
  },

  async updateProfile(id, { name, phone }) {
    await query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, id]);
    return this.findById(id);
  },

  async createResetToken(userId, tokenHash, minutes) {
    // Only the newest link works: older unused links are invalidated
    await query('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [userId]);
    await query('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))', [userId, tokenHash, minutes]);
  },

  async findValidReset(tokenHash) {
    const rows = await query(
      'SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  async consumeReset(resetId) {
    await query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [resetId]);
  },

  async setPassword(id, passwordHash) {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  },

  async setActive(id, isActive) {
    await query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    return this.findById(id);
  },
};
