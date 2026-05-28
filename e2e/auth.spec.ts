import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('wrong credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nobody@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Invalid email or password')).toBeVisible()
    // must stay on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('empty form shows browser validation (does not submit)', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')
    // browser required validation prevents submission — still on login
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated access to /super-admin redirects to /login', async ({ page }) => {
    await page.goto('/super-admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated access to /squad-admin redirects to /login', async ({ page }) => {
    await page.goto('/squad-admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated access to /player redirects to /login', async ({ page }) => {
    await page.goto('/player')
    await expect(page).toHaveURL(/\/login/)
  })

  test('super admin login redirects to /tournaments', async ({ page }) => {
    test.skip(!process.env.E2E_SUPER_ADMIN_EMAIL, 'E2E_SUPER_ADMIN_EMAIL not set')
    await loginAs(page, 'super_admin')
    await expect(page).toHaveURL(/\/tournaments/)
  })
})
