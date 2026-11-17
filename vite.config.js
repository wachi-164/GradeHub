import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true'
  ? '/GradeHub/'
  : './',
  build: { outDir: 'dist' },
  // Keep a stable origin so browser localStorage continues to use the same data.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
