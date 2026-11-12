import { defineConfig } from 'vite';

// Relative base so the built files can be served from any folder or opened from a static host.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2022' },
});
