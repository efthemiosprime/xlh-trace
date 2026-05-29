import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'tree-builder': resolve(__dirname, 'tree-builder.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.js'],
    environmentMatchGlobs: [['tests/ui/**', 'jsdom']],
  },
});
