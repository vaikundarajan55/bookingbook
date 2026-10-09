/**
 * Optional sample data so the dashboards have 12 months of history to chart.
 *   npm run db:demo         add demo guests, bookings, feedback and enquiries
 *   npm run db:demo:clear   remove everything this script added (matched by the demo email domain)
 * Never touches real guests: every row belongs to an @demo.harbourline.example address.
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const DOMAIN = '@demo.harbourline.example';
const GUESTS = ['Aarav Sharma', 'Meera Iyer', 'Rahul Verma', 'Ananya Rao', 'Vikram Singh', 'Divya Menon', 'Karthik Nair', 'Sneha Pillai', 'Arjun Reddy', 'Kavya Das'];
const FEEDBACK = [
  [5, 'Lovely sea view and the staff went out of their way for us.'],
  [4, 'Comfortable room, breakfast could have more variety.'],
  [5, 'Spotless, quiet and great location. Will be back.'],
  [3, 'Good stay but check-in took a while.'],
  [4, 'The suite was worth it. Loved the balcony.'],
];

// Deterministic pseudo-random numbers so every run produces the same picture
let seed = 42;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const clear = async (conn) => {
  // Bookings, feedback and password resets go with their users (ON DELETE CASCADE)
  const [u] = await conn.query('DELETE FROM users WHERE email LIKE ?', [`%${DOMAIN}`]);
  const [q] = await conn.query('DELETE FROM enquiries WHERE email LIKE ?', [`%${DOMAIN}`]);
  console.log(`✔ Removed ${u.affectedRows} demo guests (with their bookings and feedback) and ${q.affectedRows} demo enquiries`);
};

const run = async () => {
  const conn = await mysql.createConnection({ ...env.db });
  try {
    await clear(conn);
    if (process.argv.includes('--clear')) return;

    const hash = await bcrypt.hash('demo12345', 10);
    const userIds = [];
    for (const name of GUESTS) {
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}${DOMAIN}`;
      const [r] = await conn.query('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)', [name, email, `98${Math.floor(10000000 + rand() * 89999999)}`, hash, 'guest']);
      userIds.push(r.insertId);
    }

    const [rooms] = await conn.query('SELECT r.id, r.price_per_night, r.capacity FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.is_active = 1 AND h.is_active = 1');
    if (!rooms.length) throw new Error('No active rooms. Run `npm run db:init` first.');

    // Skip any dates real bookings already hold, so demo stays never clash with them
    const [held] = await conn.query("SELECT room_id, check_in, check_out FROM bookings WHERE status IN ('pending','confirmed','checked_in')");
    const clashes = (roomId, ci, co) => held.some((h) => h.room_id === roomId && String(h.check_in) < co && String(h.check_out) > ci);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const end = addDays(today, 45);
    let count = 0;

    for (const room of rooms) {
      let cursor = addDays(start, Math.floor(rand() * 6));
      while (cursor < end) {
        // Business grows over the year: fewer gaps between stays in recent months
        const progress = (cursor - start) / (end - start);
        cursor = addDays(cursor, Math.floor(rand() * (14 - progress * 9)) + 1);
        const nights = 1 + Math.floor(rand() * 4);
        const checkOut = addDays(cursor, nights);
        if (cursor >= end) break;
        const ci = iso(cursor); const co = iso(checkOut);
        if (clashes(room.id, ci, co)) { cursor = checkOut; continue; }

        const past = checkOut <= today;
        const current = cursor <= today && checkOut > today;
        const cancelled = rand() < 0.08;
        let status = 'confirmed';
        if (cancelled) status = 'cancelled';
        else if (past) status = 'checked_out';
        else if (current) status = 'checked_in';
        else if (rand() < 0.35) status = 'pending';

        const createdAt = addDays(cursor, -(3 + Math.floor(rand() * 25)));
        const paid = !cancelled && (past || current || rand() < 0.5);
        const paidAt = paid ? addDays(createdAt, Math.floor(rand() * 3)) : null;
        const ref = `HBDEMO${String(++count).padStart(5, '0')}`;
        await conn.query(
          `INSERT INTO bookings (reference, user_id, room_id, check_in, check_out, guests, total_price, status,
                                 payment_status, payment_method, paid_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ref, pick(userIds), room.id, ci, co, 1 + Math.floor(rand() * room.capacity), nights * Number(room.price_per_night), status,
            paid ? 'paid' : 'unpaid', paid ? pick(['card', 'upi', 'card', 'netbanking']) : null, paidAt, createdAt > today ? today : createdAt],
        );
        cursor = checkOut;
      }
    }

    const [[hotel]] = await conn.query('SELECT MIN(id) AS id FROM hotels');
    for (const [rating, comment] of FEEDBACK) {
      await conn.query('INSERT INTO feedback (user_id, hotel_id, rating, comment, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [pick(userIds), hotel.id, rating, comment, rand() < 0.5 ? 'reviewed' : 'new', addDays(today, -Math.floor(rand() * 60))]);
    }
    for (const [subject, message] of [['Group booking for a wedding', 'We need 8 rooms for two nights in December. Is there a group rate?'], ['Airport pickup', 'Do you offer pickup from the airport for late-night arrivals?'], ['Corporate stay', 'Looking for a monthly rate for two colleagues.']]) {
      const name = pick(GUESTS);
      await conn.query('INSERT INTO enquiries (name, email, hotel_id, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [name, `${name.toLowerCase().replace(/\s+/g, '.')}${DOMAIN}`, hotel.id, subject, message, addDays(today, -Math.floor(rand() * 20))]);
    }
    console.log(`✔ Added ${GUESTS.length} demo guests, ${count} bookings over 12 months, ${FEEDBACK.length} reviews and 3 enquiries`);
    console.log('  Demo guests sign in with password demo12345. Remove everything with: npm run db:demo:clear');
  } finally {
    await conn.end();
  }
};

run().catch((err) => { console.error('Demo data failed:', err.message); process.exit(1); });
