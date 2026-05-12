import { defineConfig } from 'vite';

export default defineConfig({
  base: '/particle-text-animation/',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
