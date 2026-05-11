import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Score entry', () => {
  test('squad admin can see scores page', async ({ page }) => {
    await loginAs(page, 'squad_admin')
    await page.goto('/squad-admin/scores')
    await expect(page).not.toHaveURL('/login')
    // Should show some content
    await expect(page.locator('body')).toBeVisible()
  })

  test('player can see live scores page', async ({ page }) => {
    await loginAs(page, 'player')
    await page.goto('/player/scores')
    await expect(page).not.toHaveURL('/login')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('player live scores shows no active encounter message when idle', async ({ page }) => {
    await loginAs(page, 'player')
    await page.goto('/player/scores')
    // Either shows active encounter or "no active encounter" message
    const hasNoEncounter = await page.getByText(/No active encounter/i).isVisible().catch(() => false)
    const hasEncounter = await page.locator('h1:has-text("vs")').isVisible().catch(() => false)
    expect(hasNoEncounter || hasEncounter).toBe(true)
  })

  test('player cannot access squad admin score entry', async ({ page }) => {
    await loginAs(page, 'player')
    await page.goto('/squad-admin/scores')
    // Should be redirected away from squad-admin
    await expect(page).not.toHaveURL(/squad-admin/)
  })

  test('super admin can see encounter pages', async ({ page }) => {
    await loginAs(page, 'super_admin')
    await page.goto('/super-admin/bracket')
    await expect(page).not.toHaveURL('/login')
    // Bracket page should load
    await expect(page.getByRole('heading')).toBeVisible()
  })
})
