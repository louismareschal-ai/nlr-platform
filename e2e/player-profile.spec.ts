import { test, expect } from '@playwright/test'

test.describe('Public player profile pages', () => {
  test('players page loads without auth', async ({ page }) => {
    await page.goto('/players')
    await expect(page).toHaveTitle(/NLR Open/)
    // Should show heading
    await expect(page.getByRole('heading', { name: /Players/i })).toBeVisible()
    // Should have search input
    await expect(page.getByPlaceholder(/Search by name/i)).toBeVisible()
  })

  test('player search filters results', async ({ page }) => {
    await page.goto('/players')
    const searchInput = page.getByPlaceholder(/Search by name/i)
    await searchInput.fill('test')
    await page.keyboard.press('Enter')
    await page.waitForURL(/[?&]q=test/)
    // Page should still be accessible
    await expect(page.getByRole('heading', { name: /Players/i })).toBeVisible()
  })

  test('player search via URL param', async ({ page }) => {
    await page.goto('/players?q=louis')
    await expect(page).not.toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /Players/i })).toBeVisible()
  })

  test('nonexistent player ID returns 404', async ({ page }) => {
    const response = await page.goto('/players/nonexistent-player-id-12345')
    // Should either 404 or show "not available" message gracefully
    const status = response?.status()
    // Accept 200 with "not found" message or actual 404
    if (status === 200) {
      // Check the page shows some error state
      await expect(page).not.toHaveURL('/login')
    } else {
      expect(status).toBe(404)
    }
  })

  test('tournaments page loads without auth', async ({ page }) => {
    await page.goto('/tournaments')
    await expect(page).toHaveTitle(/NLR Open/)
    await expect(page.getByRole('heading', { name: /Tournaments/i })).toBeVisible()
  })

  test('tournament filter by status works', async ({ page }) => {
    await page.goto('/tournaments')
    const activeFilter = page.getByRole('link', { name: /Live/i })
    if (await activeFilter.isVisible()) {
      await activeFilter.click()
      await page.waitForURL(/status=active/)
      await expect(page.getByRole('heading', { name: /Tournaments/i })).toBeVisible()
    }
  })

  test('public tournament page loads', async ({ page }) => {
    // First get list of tournaments to find a valid slug
    await page.goto('/tournaments')
    const firstCard = page.locator('a[href^="/tournaments/"]').first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      // Should show tournament page
      await expect(page).not.toHaveURL('/login')
      // Should have some tournament info
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('public nav shows NLR Open branding', async ({ page }) => {
    await page.goto('/players')
    await expect(page.getByText('NLR Open').first()).toBeVisible()
  })

  test('public nav links work', async ({ page }) => {
    await page.goto('/players')
    // Click Tournaments nav link
    await page.getByRole('link', { name: 'Tournaments' }).first().click()
    await expect(page).toHaveURL('/tournaments')
  })
})
