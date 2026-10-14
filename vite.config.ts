import { defineConfig } from 'vite';

export default defineConfig({
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
