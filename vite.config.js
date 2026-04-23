import { defineConfig } from 'vite';

export default defineConfig({
  base: '/repo-test-1-a/particle-system/',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
