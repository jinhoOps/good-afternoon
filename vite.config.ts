import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/pre-cyan-village',
  publicDir: '../../public',
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
});
