import { expect, test } from '@playwright/test'

test.describe('docs page', () => {
  test('renders the masthead and both specimens', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/insane-forms/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('the schema is the form')
    await expect(page.getByText('SPECIMEN A')).toBeVisible()
    await expect(page.getByText('SPECIMEN B')).toBeVisible()
    await expect(page.getByRole('link', { name: /storybook/i })).toHaveAttribute(
      'href',
      './storybook/',
    )
  })

  test('valid submit shows the parsed z.output including the hidden id', async ({ page }) => {
    await page.goto('/')
    const specimenA = page.locator('.demo-pane').first()
    await specimenA.locator('input[id="name"]').fill('Ada Lovelace')
    await specimenA.locator('input[id="email"]').first().fill('ada@example.com')
    await specimenA.locator('input[id="address.city"]').fill('London')
    await specimenA.locator('input[id="address.zip"]').fill('12345')
    await specimenA.locator('input[id="contacts.0.email"]').fill('charles@example.com')
    await specimenA.getByRole('button', { name: 'SAVE' }).click()

    const receipt = page.locator('.receipt')
    await expect(receipt).toBeVisible()
    // The hidden field never rendered, yet the parse filled its default.
    await expect(receipt).toContainText('"id": "srv-000"')
    await expect(receipt).toContainText('"name": "Ada Lovelace"')
    await expect(receipt).toContainText('"age": 18') // declared .default(18)
  })

  test('invalid submit shows field errors and no receipt', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'SAVE' }).first().click()
    await expect(page.locator('em[role="alert"]').first()).toBeVisible()
    await expect(page.locator('.receipt')).toHaveCount(0)
  })

  test('contact list bounds gate the add/remove chrome', async ({ page }) => {
    await page.goto('/')
    const specimenA = page.locator('.demo-pane').first()
    const add = specimenA.locator('button[data-add]')
    // Seeded with 1 row (min 1): no remove button yet.
    await expect(specimenA.locator('button[data-remove]')).toHaveCount(0)
    await add.click()
    await add.click()
    // At max(3) the add button disappears; every row is removable again.
    await expect(add).toHaveCount(0)
    await expect(specimenA.locator('button[data-remove]')).toHaveCount(3)
  })

  test('recursive tree renders to data depth and grows', async ({ page }) => {
    await page.goto('/')
    const specimenB = page.locator('.demo-pane').nth(1)
    await expect(specimenB.locator('input[id="name"]')).toHaveValue('root')
    await expect(specimenB.locator('input[id="children.0.name"]')).toHaveValue('docs')
    await expect(specimenB.locator('input[id="children.0.children.0.name"]')).toHaveValue('api')
    // Growing the tree at the root: the root list's add button is the LAST one
    // in DOM order (nested lists render their own add buttons first).
    await specimenB.locator('button[data-add]').last().click()
    await expect(specimenB.locator('input[id="children.1.name"]')).toHaveValue('')
  })
})
