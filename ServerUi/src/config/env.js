import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrls: (process.env.CLIENT_URLS || 'http://localhost:5178').split(',').map((u) => u.trim()),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_booking',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  // Room prices are tax-inclusive; invoices show this percentage as the tax part of the total
  taxRate: Number(process.env.TAX_RATE ?? 12),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Harbourline Hotel <no-reply@harbourline.example>',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@hotel.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
};

// Development only: also accept the site opened from this network (http://192.168.x.x:5178 etc.)
const LAN_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

/** True for configured client URLs, plus local-network addresses while developing. */
export const isAllowedOrigin = (origin) =>
  Boolean(origin) && (env.clientUrls.includes(origin) || (env.nodeEnv === 'development' && LAN_HOST.test(origin)));

/** CORS origin callback shared by Express and Socket.io (requests without an Origin, e.g. curl, are allowed). */
export const corsOrigin = (origin, callback) => callback(null, !origin || isAllowedOrigin(origin));
