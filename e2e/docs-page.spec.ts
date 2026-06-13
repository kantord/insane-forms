import { expect, test } from '@playwright/test'

test.describe('docs page', () => {
  test('renders the masthead and both sections', async ({ page }) => {
    await page.goto('/')
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
    await page.goto('/')
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
    await page.goto('/')
    const specimenA = page.locator('#showcase-bureau .demo-pane')
    await specimenA.getByRole('button', { name: 'SAVE' }).click()
    await expect(specimenA.locator('em[role="alert"]').first()).toBeVisible()
    await expect(specimenA.locator('.receipt')).toHaveCount(0)
  })

  test('contact list bounds gate the add/remove chrome', async ({ page }) => {
    await page.goto('/')
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
    await page.goto('/')
    const pane = page.locator('#showcase-bureau .carbon')
    await expect(pane).not.toContainText('@note') // the comment itself never shows
    const note = pane.locator('.code-note').first()
    await expect(note).toHaveAttribute('data-note', /.+/)
    await expect(note).toHaveAttribute('tabindex', '0') // keyboard-reachable
  })

  test('biome content is co-located per chapter (statements then showcase)', async ({ page }) => {
    await page.goto('/')
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('[id]')]
        .map((e) => e.id)
        .filter((id) => /^(bureau|terminal|meadow|showcase)/.test(id)),
    )
    expect(ids).toEqual([
      'bureau',
      'bureau-2',
      'showcase-bureau',
      'terminal',
      'terminal-2',
      'showcase-terminal',
      'meadow',
      'meadow-2',
      'showcase-meadow',
    ])
  })

  test('Next button fills with scroll progress through the active screen', async ({ page }) => {
    await page.goto('/#bureau')
    const navProgress = () =>
      page.evaluate(() => {
        const wrap = [...document.querySelectorAll<HTMLElement>('div.fixed')].find(
          (d) => d.querySelector('button') && getComputedStyle(d).opacity !== '0',
        )
        return Number.parseFloat(wrap?.style.getPropertyValue('--nav-progress') || '-1')
      })
    await page.evaluate(() => document.getElementById('bureau')?.scrollIntoView())
    await expect.poll(navProgress).toBeLessThan(0.1)
    await page.evaluate(() => {
      const el = document.getElementById('bureau')
      if (el)
        window.scrollTo(
          0,
          el.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.45,
        )
    })
    await expect.poll(navProgress).toBeGreaterThan(0.25)
  })

  test('recursive tree renders to data depth and grows', async ({ page }) => {
    await page.goto('/')
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
