import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  testDir: './e2e/production',
  outputDir: 'test-results/production',
  testIgnore: [],
  workers: 1,
  use: { ...base.use, baseURL: 'http://127.0.0.1:4183' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4183',
    url: 'http://127.0.0.1:4183',
    reuseExistingServer: false,
  },
})
