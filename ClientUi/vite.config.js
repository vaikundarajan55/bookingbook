import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178,
    strictPort: true, // fail loudly instead of silently sharing a port with another dev server
    host: true, // listen on the network too, so phones and other PCs can open http://<this-pc-ip>:5178
    // The browser only ever talks to this server; API calls and live updates are forwarded to the backend.
    // That way the app works the same whether it is opened as localhost or by IP address.
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep vendor code in its own cached chunks; admin and website code split via React.lazy
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
