import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: { enabled: false },
  },
  resolve: {
    alias: {
      '@domain': resolve('./src/lib/domain'),
      '@application': resolve('./src/lib/application'),
      '@infrastructure': resolve('./src/lib/infrastructure'),
      '@presentation': resolve('./src/lib/presentation'),
    },
  },
});
