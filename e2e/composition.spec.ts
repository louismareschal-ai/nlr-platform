import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Composition submission', () => {
  test('squad admin can navigate to encounters via bracket', async ({ page }) => {
    await loginAs(page, 'squad_admin')
    await page.goto('/squad-admin')
    await expect(page).not.toHaveURL('/login')
    // Check nav has composition link
    await expect(page.getByRole('link', { name: /Composition/i })).toBeVisible()
  })

  test('squad admin composition page loads', async ({ page }) => {
    await loginAs(page, 'squad_admin')
    await page.goto('/squad-admin/composition')
    await expect(page).not.toHaveURL('/login')
  })

  test('squad admin schedule page loads', async ({ page }) => {
    await loginAs(page, 'squad_admin')
    await page.goto('/squad-admin/schedule')
    await expect(page).not.toHaveURL('/login')
  })

  test('squad admin scores page loads', async ({ page }) => {
    await loginAs(page, 'squad_admin')
    await page.goto('/squad-admin/scores')
    await expect(page).not.toHaveURL('/login')
  })

  test('encounter page redirects non-members', async ({ page }) => {
    await loginAs(page, 'player')
    // Player role is redirected away from squad-admin
    await page.goto('/squad-admin/encounters/nonexistent-id')
    // Should redirect to player area or login
    await expect(page).not.toHaveURL(/squad-admin/)
  })
})
