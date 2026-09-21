import { expect, test } from '@playwright/test'

test.describe('docs page', () => {
  test('renders the masthead', async ({ page }) => {
    await page.goto('./')
    await expect(page).toHaveTitle(/insane-forms/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('the schema is the form')
    await expect(page.getByRole('link', { name: 'storybook' })).toHaveAttribute(
      'href',
      './storybook/',
    )
  })

  // The design-biomes section (bureau/terminal/meadow showcases) was removed
  // from the landing page "for now" — the components themselves are still
  // real and working (src/components/Showcase.tsx, BiomeDemos.tsx,
  // CodePane.tsx), just not rendered on this page. Skipped, not deleted, so
  // this coverage comes back the moment the section does.
  test.skip('valid submit shows the parsed z.output including the hidden id', async ({ page }) => {
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

  test.skip('invalid submit shows field errors and no receipt', async ({ page }) => {
    await page.goto('./')
    const specimenA = page.locator('#showcase-bureau .demo-pane')
    await specimenA.getByRole('button', { name: 'SAVE' }).click()
    await expect(specimenA.locator('em[role="alert"]').first()).toBeVisible()
    await expect(specimenA.locator('.receipt')).toHaveCount(0)
  })

  test.skip('contact list bounds gate the add/remove chrome', async ({ page }) => {
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

  test.skip('code notes annotate confusing parts, stripped from display', async ({ page }) => {
    await page.goto('./')
    const pane = page.locator('#showcase-bureau .carbon')
    await expect(pane).not.toContainText('@note') // the comment itself never shows
    const note = pane.locator('.code-note').first()
    await expect(note).toHaveAttribute('data-note', /.+/)
    await expect(note).toHaveAttribute('tabindex', '0') // keyboard-reachable
  })

  test('schema-morph renders the funnel then steps 2-4 as static sections', async ({ page }) => {
    await page.goto('./')
    // All steps are on the page at once — no stepper/carousel to click
    // through. The funnel (#morph) is one section, three panes: the schema
    // and the hand-written UI (two separate, disconnected files, shown as
    // CODE only — no live-rendered preview) converging into the field
    // binding below them (react-xarrows draws the two connecting arrows).
    const funnel = page.locator('#morph')
    await expect(funnel).toContainText('The schema (Zod)')
    await expect(funnel).toContainText('The form field (any React component)')
    await expect(funnel.locator('form')).toHaveCount(0)
    await expect(funnel.locator('input')).toHaveCount(0)
    // 2 arrows × (body path + arrowhead path) = 4 real SVG paths, not
    // decoration-only markup.
    await expect(funnel.locator('svg path[d]')).toHaveCount(4)
    // Step 2: customize — same field, live and schema-driven now.
    const step2 = page.locator('#morph-step-2')
    await expect(step2.locator('input[id="name"]')).toBeVisible()
    // Step 3: compose — two fields grouped into one object.
    const step3 = page.locator('#morph-step-3')
    await expect(step3.locator('input[id="name"]')).toBeVisible()
    await expect(step3.locator('input[id="email"]')).toBeVisible()
    // Step 4: inject markup — the same composed group, plus a plain <h4>
    // dropped in as a part, not a field.
    const step4 = page.locator('#morph-step-4')
    await expect(step4.getByRole('heading', { level: 4, name: 'Contact card' })).toBeVisible()
    await expect(step4.locator('input[id="name"]')).toBeVisible()
  })

  test.skip('recursive tree renders to data depth and grows', async ({ page }) => {
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
