import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Hosted on Vercel at the domain root (P10 plan SC11/SC22).
export default defineConfig({
  base: '/',
  plugins: [preact()],
});
