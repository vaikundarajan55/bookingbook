import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { query, testConnection } from './config/db.js';
import { ensureAdmin } from './database/seedAdmin.js';
import { migrate } from './database/migrate.js';
import { initSocket } from './sockets/index.js';

const start = async () => {
  try {
    await testConnection();
    console.log('✔ MySQL connected');
    await migrate(query);
    if ((await ensureAdmin(query)) === 'created') console.log(`✔ Default admin saved -> ${env.admin.email}`);
  } catch (err) {
    console.error(`✖ Database startup failed: ${err.message}`);
    console.error('  Check ServerUi/.env and run `npm run db:init` first.');
    process.exit(1);
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`✔ API + Socket.io running on http://localhost:${env.port}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
