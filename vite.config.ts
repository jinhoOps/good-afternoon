import { defineConfig } from 'vite';

export default defineConfig({
  base: '/good-afternoon/',
  root: 'src/market-game',
  publicDir: '../../public',
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
});
