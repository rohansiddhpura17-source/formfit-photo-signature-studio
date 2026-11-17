import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// FORMFIT Studio is distributed as a single, self-contained HTML file so it can
// run from file:// with no network access. Fonts are inlined as data URLs.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 4000,
    reportCompressedSize: false,
  },
  server: { port: 5175, strictPort: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // macOS resource-fork files (._*) can appear on external volumes and are
    // not valid TypeScript. Never treat them as tests.
    exclude: ['**/node_modules/**', '**/._*'],
  },
});
