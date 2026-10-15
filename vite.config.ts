import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5178,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5179,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        island: 'index.html',
        apartments: 'apartments.html',
        northCity: 'north-city.html',
        liminette: 'liminette.html',
        room: 'room.html',
      },
    },
  },
});
