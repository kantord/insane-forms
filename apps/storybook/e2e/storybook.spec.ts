import { expect, test } from '@playwright/test'

test.describe('storybook', () => {
  test('manager loads with all story groups', async ({ page }) => {
    await page.goto('/storybook/')
    // Top-level folders (Examples, Integration examples, …) render as sidebar
    // nodes; assert their labels are present rather than a specific role.
    for (const group of ['Examples', 'Integration examples', 'Misc', 'Tests']) {
      await expect(page.getByText(group, { exact: true }).first()).toBeVisible()
    }
  })

  test('wizard story gates steps and highlights errors', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=examples-multi-step--checkout&viewMode=story')
    await page.getByRole('button', { name: 'Next' }).click()
    // Stays on step 1 with errors; the Account chip is marked invalid.
    const accountChip = page.getByRole('button', { name: /1\s*Account/ })
    await expect(accountChip).toHaveAttribute('aria-current', 'step')
    await expect(accountChip).toHaveClass(/destructive/)
    // Filling the step unblocks Next.
    await page.getByLabel(/name/i).fill('Evil Rabbit')
    await page.getByLabel(/email/i).fill('evil@rabbit.com')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('button', { name: /2\s*Shipping/ })).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  test('settings story submits the typed output', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=examples-forms--profile&viewMode=story')
    // Field ids are the schema paths — stable selectors for flat fields.
    await page.locator('#name').fill('Evil Rabbit')
    await page.locator('#email').fill('evil@rabbit.com')
    await page.getByRole('button', { name: 'Save changes' }).click()
    const output = page.locator('[data-sonner-toaster] pre') // submitted values toast
    await expect(output).toContainText('"id": "usr_1a2b3c"') // hidden, parse-filled
    await expect(output).toContainText('"frequency": "Daily digest"') // enum .default()
  })
})
