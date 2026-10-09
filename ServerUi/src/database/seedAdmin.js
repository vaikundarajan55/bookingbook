import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

// Makes sure the default admin from .env exists in the users table.
// `run(sql, params)` must resolve to the result rows (works with a pool or a single connection).
export const ensureAdmin = async (run) => {
  const [existing] = await run('SELECT id, role FROM users WHERE email = ? LIMIT 1', [env.admin.email]);

  if (!existing) {
    const hash = await bcrypt.hash(env.admin.password, 10);
    await run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Hotel Admin', env.admin.email, hash, 'admin']);
    return 'created';
  }

  if (existing.role !== 'admin') {
    await run("UPDATE users SET role = 'admin', is_active = 1 WHERE id = ?", [existing.id]);
    return 'promoted';
  }

  return 'exists';
};
