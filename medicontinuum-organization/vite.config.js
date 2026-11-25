import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  // Organization portal: its own port (patient site is 5173). No backend — everything runs in the browser.
  server: { port: 5174, strictPort: true, fs: { allow: ['..'] } },
  preview: { port: 5174, strictPort: true },
});
