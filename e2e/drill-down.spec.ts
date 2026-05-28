import { test, expect } from '@playwright/test'

test.describe('Spectator drill-down (public)', () => {
  test('tournaments -> bracket', async ({ page }) => {
    await page.goto('/tournaments')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Tournaments' })).toBeVisible()

    const firstCard = page.locator('a[href^="/tournaments/"][href*="/bracket"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.click()
    await expect(page).toHaveURL(/\/tournaments\/[^/]+\/bracket/)
  })

  test('squads list -> squad detail -> all squads back link', async ({ page }) => {
    await page.goto('/tournaments/test/squads')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Squads' })).toBeVisible()

    const firstSquadLink = page.locator('a[href*="/squads/"][href*="-"]').first()
    await expect(firstSquadLink).toBeVisible()
    await firstSquadLink.click()
    await expect(page).toHaveURL(/\/tournaments\/test\/squads\/[0-9a-f-]{36}/)

    // Squad detail renders record + roster sections
    await expect(page.getByText(/Encounter record/i)).toBeVisible()
    await expect(page.getByText(/Roster/i)).toBeVisible()

    // Back link works
    await page.getByRole('link', { name: /All squads/i }).click()
    await expect(page).toHaveURL('/tournaments/test/squads')
  })

  test('squad detail -> player profile', async ({ page }) => {
    await page.goto('/tournaments/test/squads')
    const firstSquad = page.locator('a[href*="/squads/"][href*="-"]').first()
    await firstSquad.click()
    await page.waitForURL(/\/squads\/[0-9a-f-]{36}/)

    const firstPlayer = page.locator('a[href^="/players/"]').first()
    await expect(firstPlayer).toBeVisible()
    await firstPlayer.click()
    await expect(page).toHaveURL(/\/players\/[^/]+/)
    await expect(page).not.toHaveURL(/\/login/)

    // Player profile page rendered (back link or h1 visible)
    await expect(page.getByRole('link', { name: /Back to players/i })).toBeVisible()
  })

  test('nonexistent squad returns 404', async ({ page }) => {
    const res = await page.goto('/tournaments/test/squads/00000000-0000-0000-0000-000000000000')
    expect(res?.status()).toBe(404)
  })
})
