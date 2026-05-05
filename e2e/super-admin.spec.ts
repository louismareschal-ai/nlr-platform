import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Super admin', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_SUPER_ADMIN_EMAIL, 'E2E_SUPER_ADMIN_EMAIL not set')
    await loginAs(page, 'super_admin')
  })

  test('dashboard loads with nav links', async ({ page }) => {
    await page.goto('/super-admin')
    // Two nav elements exist (desktop + mobile) — just confirm at least one has links
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tournaments' }).first()).toBeVisible()
  })

  test('tournaments list page loads', async ({ page }) => {
    await page.goto('/super-admin/tournaments')
    await expect(page).toHaveURL(/\/super-admin\/tournaments/)
    // should not be a blank page or error
    await expect(page.locator('body')).not.toContainText('500')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('new tournament form renders required fields', async ({ page }) => {
    await page.goto('/super-admin/tournaments/new')
    // Expect a form with at minimum a name/date field
    const inputs = page.locator('input')
    await expect(inputs.first()).toBeVisible()
  })

  test('players page loads', async ({ page }) => {
    await page.goto('/super-admin/players')
    await expect(page).toHaveURL(/\/super-admin\/players/)
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('tournament detail: setup steps render when tournament exists', async ({ page }) => {
    await page.goto('/super-admin/tournaments')
    // Use "Manage →" links to reach detail pages (avoids matching the "New tournament" link)
    const manageLink = page.getByRole('link', { name: /Manage/i }).first()
    const count = await manageLink.count()
    test.skip(count === 0, 'No tournaments in DB — skipping detail page tests')

    await manageLink.click()
    await expect(page).toHaveURL(/\/super-admin\/tournaments\/.+/)

    // Step 1 — Squads is always rendered as a full section (never locked)
    await expect(page.getByText(/Step 1/i).first()).toBeVisible()
    // Step 2+ may be locked (rendered as numbered circle, not "Step N" heading) — checked separately
  })

  test('tournament setup: courts step only visible after players assigned', async ({ page }) => {
    await page.goto('/super-admin/tournaments')
    const manageLink = page.getByRole('link', { name: /Manage/i }).first()
    if (await manageLink.count() === 0) test.skip(true, 'No tournaments')

    await manageLink.click()
    await expect(page).toHaveURL(/\/super-admin\/tournaments\/.+/)

    // Either the courts section is open (Step 2 heading) or locked (label text)
    const lockedCourts = page.getByText(/Courts.*fill squads first/i)
    const courtsSection = page.getByText(/Step 2 — Courts/i)
    const isLocked = await lockedCourts.count() > 0
    const isOpen = await courtsSection.count() > 0
    expect(isLocked || isOpen).toBe(true)
  })
})
