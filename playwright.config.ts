import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'
config({ path: '.env.test' })

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3010',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
