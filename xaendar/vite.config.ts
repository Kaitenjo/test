import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    emptyOutDir: true,
    outDir: '../dist'
  },
  server: {
    open: true,
    port: 4200,
    forwardConsole: false
  }
});