import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { ensureAdmin } from './seedAdmin.js';
import { migrate } from './migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rooms = [
  ['Harbour Standard', 'standard', 'Quiet room facing the marina with a work desk and rain shower.', 95, 2, 280, ['Wi-Fi', 'Air conditioning', 'Rain shower', 'Work desk'], 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200', true],
  ['Tide Deluxe', 'deluxe', 'Corner room with floor-to-ceiling windows and a king bed.', 150, 2, 380, ['Wi-Fi', 'King bed', 'Mini bar', 'Sea view', 'Smart TV'], 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200', true],
  ['Lighthouse Suite', 'suite', 'Two-room suite with lounge, private balcony and bathtub.', 290, 3, 620, ['Wi-Fi', 'Balcony', 'Bathtub', 'Lounge', 'Breakfast included'], 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200', true],
  ['Coral Family Room', 'family', 'Two queen beds, kids corner and connecting-door option.', 190, 4, 520, ['Wi-Fi', 'Two queen beds', 'Kids corner', 'Mini fridge'], 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200', true],
  ['Anchor Deluxe Twin', 'deluxe', 'Twin beds, garden outlook and a reading nook.', 135, 2, 360, ['Wi-Fi', 'Twin beds', 'Garden view', 'Tea station'], 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200', false],
  ['Skyline Penthouse', 'suite', 'Top-floor penthouse with a terrace, dining area and city views.', 480, 4, 900, ['Wi-Fi', 'Terrace', 'Dining area', 'Butler service', 'Jacuzzi'], 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200', true],
];

const run = async () => {
  const conn = await mysql.createConnection({
    host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password, multipleStatements: true,
  });

  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(schema.replace(/hotel_booking/g, env.db.database));
  console.log('✔ Schema ready');

  await conn.query(`USE \`${env.db.database}\``);

  const exec = async (sql, params) => (await conn.query(sql, params))[0];
  await migrate(exec);
  console.log('✔ Hotels + AC columns ready');

  const adminStatus = await ensureAdmin(exec);
  console.log(`✔ Admin ${adminStatus} -> ${env.admin.email}`);

  const [[{ total: roomCount }]] = await conn.query('SELECT COUNT(*) AS total FROM rooms');
  if (roomCount === 0) {
    const [{ id: hotelId }] = await exec('SELECT MIN(id) AS id FROM hotels');
    for (const [name, type, description, price, capacity, size, amenities, image, isAc] of rooms) {
      await conn.query(
        'INSERT INTO rooms (hotel_id, name, type, description, price_per_night, capacity, is_ac, size_sqft, amenities, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [hotelId, name, type, description, price, capacity, isAc ? 1 : 0, size, JSON.stringify(amenities), image],
      );
    }
    console.log(`✔ ${rooms.length} sample rooms added`);
  }

  await conn.end();
  console.log('Database ready.');
};

run().catch((err) => {
  console.error('Database init failed:', err.message);
  process.exit(1);
});
