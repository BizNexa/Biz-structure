import { defineConfig } from 'vite';

// Entity Tax Comparison page: same engine, rules and styles as the calculator, published to /entity-tax-comparison/.
export default defineConfig({
  root: 'compare',
  base: './',
  publicDir: '../public',
  build: { outDir: '../../entity-tax-comparison', emptyOutDir: true, target: 'es2022' },
});
