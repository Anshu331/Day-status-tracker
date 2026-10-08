import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // PGlite takes a few seconds to boot per test file
    hookTimeout: 60_000,
    testTimeout: 15_000,
  },
});
