/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Pin discovery to the canonical test dir so a stray src/*.test.ts can't
    // silently reintroduce duplicate/divergent suites.
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    // Restore spies between tests so a throwing spy can't leak across cases.
    restoreMocks: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})
