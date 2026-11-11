/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { injectSeo } from './scripts/seo-content';

/** Injects crawlable content (limits table, FAQ, JSON-LD) generated from the compiled rule set. */
function seoContent(): Plugin {
  return {
    name: 'gst-seo-content',
    transformIndexHtml(html) {
      const rs = JSON.parse(readFileSync(new URL('./engine/generated/ruleset.json', import.meta.url), 'utf8'));
      return injectSeo(html, rs);
    },
  };
}

export default defineConfig({
  plugins: [react(), seoContent()],
  base: './', // static hosting at /gst-registration-checker/ or any path
  build: { outDir: 'dist', sourcemap: false },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
