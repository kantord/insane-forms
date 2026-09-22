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
