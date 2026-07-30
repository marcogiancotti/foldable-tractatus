import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from './vite/prerender';

export default defineConfig({
  plugins: [
    react(),
    // Bakes the whole book into dist/index.html for crawlers that do not run
    // JS, and emits sitemap.xml. Build only — see vite/prerender.ts.
    prerender({ lastmod: new Date().toISOString().slice(0, 10) }),
  ],
});
