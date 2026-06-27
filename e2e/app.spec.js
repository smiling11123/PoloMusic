import { test, expect } from '@playwright/test'

test('app loads and shows main layout', async ({ page }) => {
  await page.goto('/')
  // The app should render without crashing
  await expect(page.locator('.Topbar')).toBeVisible()
  await expect(page.locator('.mainpage')).toBeVisible()
  await expect(page.locator('.TouchBar')).toBeVisible()
})
