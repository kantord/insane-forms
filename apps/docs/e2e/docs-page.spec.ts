import { expect, test } from '@playwright/test'

test.describe('docs page', () => {
  test('renders the masthead and both showcases', async ({ page }) => {
    await page.goto('./')
    await expect(page).toHaveTitle(/insane-forms/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('the schema is the form')
    await expect(
      page.getByRole('heading', { name: /nested groups, hidden field, dynamic list/i }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: /recursive tree/i })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /storybook — every piece in isolation/i }),
    ).toHaveAttribute('href', './storybook/')
  })

  test('valid submit shows the parsed z.output including the hidden id', async ({ page }) => {
    await page.goto('./')
    const specimenA = page.locator('#showcase-bureau .demo-pane')
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
    await page.goto('./')
    const specimenA = page.locator('#showcase-bureau .demo-pane')
    await specimenA.getByRole('button', { name: 'SAVE' }).click()
    await expect(specimenA.locator('em[role="alert"]').first()).toBeVisible()
    await expect(specimenA.locator('.receipt')).toHaveCount(0)
  })

  test('contact list bounds gate the add/remove chrome', async ({ page }) => {
    await page.goto('./')
    const specimenA = page.locator('#showcase-bureau .demo-pane')
    const add = specimenA.locator('button[data-add]')
    // Seeded with 1 row (min 1): no remove button yet.
    await expect(specimenA.locator('button[data-remove]')).toHaveCount(0)
    await add.click()
    await add.click()
    // At max(3) the add button disappears; every row is removable again.
    await expect(add).toHaveCount(0)
    await expect(specimenA.locator('button[data-remove]')).toHaveCount(3)
  })

  test('code notes annotate confusing parts, stripped from display', async ({ page }) => {
    await page.goto('./')
    const pane = page.locator('#showcase-bureau .carbon')
    await expect(pane).not.toContainText('@note') // the comment itself never shows
    const note = pane.locator('.code-note').first()
    await expect(note).toHaveAttribute('data-note', /.+/)
    await expect(note).toHaveAttribute('tabindex', '0') // keyboard-reachable
  })

  test('schema-morph renders every step as its own static section', async ({ page }) => {
    await page.goto('./')
    // All steps are on the page at once — no stepper/carousel to click
    // through. Step 1 is the funnel: schema and hand-written UI shown as
    // two separate code panes, with the disconnected UI actually usable.
    const step1 = page.locator('#morph')
    await expect(step1).toContainText('the data')
    await expect(step1).toContainText('the UI — wired by hand, disconnected')
    const handWritten = step1.getByPlaceholder('a plain, hand-wired input')
    await handWritten.fill('Ada')
    await expect(handWritten).toHaveValue('Ada')
    // Step 2 is the merge itself — two code panes again (usage +
    // definition), no live demo yet; that's the whole point of this step.
    const step2 = page.locator('#morph-step-2')
    await expect(step2).toContainText('using the field')
    await expect(step2).toContainText('the field itself — where they merge')
    await expect(step2.locator('form')).toHaveCount(0)
    // Steps 3-4: the live, schema-driven field, iterated on.
    const step4 = page.locator('#morph-step-4')
    await expect(step4.locator('input[id="name"]')).toBeVisible()
  })

  test('recursive tree renders to data depth and grows', async ({ page }) => {
    await page.goto('./')
    const specimenB = page.locator('#showcase-terminal .demo-pane')
    await expect(specimenB.locator('input[id="name"]')).toHaveValue('root')
    await expect(specimenB.locator('input[id="children.0.name"]')).toHaveValue('docs')
    await expect(specimenB.locator('input[id="children.0.children.0.name"]')).toHaveValue('api')
    // Growing the tree at the root: the root list's add button is the LAST one
    // in DOM order (nested lists render their own add buttons first).
    await specimenB.locator('button[data-add]').last().click()
    await expect(specimenB.locator('input[id="children.1.name"]')).toHaveValue('')
  })
})

test.describe('explore section (persistent sidebar + Storybook embed)', () => {
  test('sidebar lists Storybook pages, collapsed until expanded', async ({ page }) => {
    await page.goto('./')
    const sidebar = page.locator('nav', { hasText: 'insane-forms' })
    // Collapsed by default — nested entries aren't there until their
    // ancestor categories are opened.
    await expect(sidebar.getByRole('link', { name: 'Profile', exact: true })).toHaveCount(0)
    await sidebar.getByRole('button', { name: 'Examples', exact: true }).click()
    await sidebar.getByRole('button', { name: 'Forms', exact: true }).click()
    await expect(sidebar.getByRole('link', { name: 'Profile', exact: true })).toBeVisible()
    // Still on the landing page — expanding a category didn't navigate away.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('the schema is the form')
  })

  test('clicking a sidebar entry embeds that Storybook page', async ({ page }) => {
    await page.goto('./')
    const sidebar = page.locator('nav', { hasText: 'insane-forms' })
    await sidebar.getByRole('button', { name: 'Examples', exact: true }).click()
    await sidebar.getByRole('button', { name: 'Forms', exact: true }).click()
    await sidebar.getByRole('link', { name: 'Profile', exact: true }).click()
    await expect(page).toHaveURL(/\/explore\?id=examples-forms--profile&mode=story/)
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('input[id="name"]')).toBeVisible()
    // The active page's ancestor category stays expanded after navigating.
    await expect(sidebar.getByRole('link', { name: 'Profile', exact: true })).toBeVisible()
  })

  test('no page picked yet shows a placeholder, not a blank pane', async ({ page }) => {
    await page.goto('./explore')
    await expect(page.getByText(/pick a page from the sidebar/i)).toBeVisible()
  })
})

test.describe('docs section (content-docs)', () => {
  test('sidebar link reaches the written docs, merged into the one persistent sidebar', async ({
    page,
  }) => {
    await page.goto('./')
    const globalSidebar = page.locator('nav', { hasText: 'insane-forms' })
    await globalSidebar.getByRole('link', { name: 'guides', exact: true }).click()
    await expect(page).toHaveURL(/\/docs\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Introduction')
    // The doc tree now lives IN the persistent sidebar, not a second one —
    // "guides" (the category, from the docs/guides/ folder name) is
    // collapsed until expanded.
    await expect(globalSidebar.getByRole('link', { name: 'Getting started' })).toHaveCount(0)
    await globalSidebar.getByRole('button', { name: 'guides', exact: true }).click()
    await expect(globalSidebar.getByRole('link', { name: 'Getting started' })).toBeVisible()
  })
})
