import { defineConfig } from 'vite';

export default defineConfig({
  base: '/good-afternoon/',
  root: 'src/pre-cyan-village',
  publicDir: '../../public',
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
});
