import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        island: 'index.html',
        apartments: 'apartments.html',
        liminette: 'liminette.html',
        room: 'room.html',
      },
    },
  },
});
