import { Page } from '@playwright/test'

export async function loginAs(page: Page, role: 'super_admin' | 'squad_admin' | 'player') {
  const creds = {
    super_admin: {
      email: process.env.E2E_SUPER_ADMIN_EMAIL!,
      password: process.env.E2E_SUPER_ADMIN_PASSWORD!,
    },
    squad_admin: {
      email: process.env.E2E_SQUAD_ADMIN_EMAIL!,
      password: process.env.E2E_SQUAD_ADMIN_PASSWORD!,
    },
    player: {
      email: process.env.E2E_PLAYER_EMAIL!,
      password: process.env.E2E_PLAYER_PASSWORD!,
    },
  }

  const { email, password } = creds[role]
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  // wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 })
}

export async function logout(page: Page) {
  // Supabase signs out by hitting the logout route — adjust if you add one
  await page.goto('/login')
}
