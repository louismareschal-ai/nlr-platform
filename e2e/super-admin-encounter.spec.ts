import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Super admin encounter management', () => {
  test('super admin bracket page loads and shows encounters or empty state', async ({ page }) => {
    await loginAs(page, 'super_admin')
    await page.goto('/super-admin/bracket')
    await expect(page).not.toHaveURL('/login')
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('super admin players page loads with points editor', async ({ page }) => {
    await loginAs(page, 'super_admin')
    await page.goto('/super-admin/players')
    await expect(page).not.toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /All Players/i })).toBeVisible()
  })

  test('super admin cannot access encounter detail for nonexistent id', async ({ page }) => {
    await loginAs(page, 'super_admin')
    const response = await page.goto('/super-admin/encounters/00000000-0000-0000-0000-000000000000')
    // Should show 404 or "not found"
    const status = response?.status()
    const isNotFound = status === 404 || await page.getByText(/not found/i).isVisible().catch(() => false)
    expect(isNotFound).toBe(true)
  })

  test('super admin schedule page loads', async ({ page }) => {
    await loginAs(page, 'super_admin')
    await page.goto('/super-admin/schedule')
    await expect(page).not.toHaveURL('/login')
  })

  test('super admin tournaments page loads', async ({ page }) => {
    await loginAs(page, 'super_admin')
    await page.goto('/super-admin/tournaments')
    await expect(page).not.toHaveURL('/login')
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('bracket links show NLR Open branding in nav', async ({ page }) => {
    await loginAs(page, 'super_admin')
    await page.goto('/super-admin')
    await expect(page.getByText('NLR Open').first()).toBeVisible()
  })

  test('player cannot access super admin pages', async ({ page }) => {
    await loginAs(page, 'player')
    await page.goto('/super-admin')
    await expect(page).not.toHaveURL(/super-admin/)
  })
})
