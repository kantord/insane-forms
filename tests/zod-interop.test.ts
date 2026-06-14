/**
 * zod-interop.test.ts — PROOF that an insane-enhanced schema is still a fully
 * ordinary Zod schema at RUNTIME, not just at the type level. The component that
 * `field`/`group`/`list`/`hidden` stamp into `.meta()` is invisible to Zod's
 * parser, so every Zod operation behaves exactly as on the bare equivalent.
 */
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as insane from '../src'

/* An insane form (the schema IS the form) — hidden+default, default, bounded list. */
const Order = insane.group(
  { id: insane.hidden(z.string().default('ord-0')) },
  { name: z.string().min(2) },
  { covers: z.number().int().default(1) },
  { dishes: insane.list(z.string()).min(1) },
)

/* The bare-Zod equivalent — same shape, no rendering. */
const PlainOrder = z.object({
  id: z.string().default('ord-0'),
  name: z.string().min(2),
  covers: z.number().int().default(1),
  dishes: z.array(z.string()).min(1),
})

describe('an insane schema is an ordinary Zod schema at runtime', () => {
  test('parse() applies defaults (including the hidden field) → z.output', () => {
    expect(Order.parse({ name: 'Gala', dishes: ['soup'] })).toEqual({
      id: 'ord-0',
      name: 'Gala',
      covers: 1,
      dishes: ['soup'],
    })
  })

  test('parses identically to the equivalent bare-Zod schema', () => {
    const input = { name: 'Gala', covers: 80, dishes: ['soup', 'roast'] }
    expect(Order.parse(input)).toEqual(PlainOrder.parse(input))
  })

  test('safeParse() reports the same validation issues, by path', () => {
    const result = Order.safeParse({ name: 'A', dishes: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.')).sort()
      expect(paths).toEqual(['dishes', 'name'])
    }
  })

  test('standard ZodObject combinators still work (.shape/.pick/.extend)', () => {
    expect(Object.keys(Order.shape)).toEqual(['id', 'name', 'covers', 'dishes'])

    const Picked = Order.pick({ name: true })
    expect(Picked.parse({ name: 'Gala' })).toEqual({ name: 'Gala' })

    const Extended = Order.extend({ rush: z.boolean().default(false) })
    expect(Extended.parse({ name: 'Gala', dishes: ['soup'] })).toMatchObject({ rush: false })
  })

  test('works with Zod ecosystem tooling (z.toJSONSchema)', () => {
    const json = z.toJSONSchema(Order) as { type?: string; properties?: Record<string, unknown> }
    expect(json.type).toBe('object')
    expect(Object.keys(json.properties ?? {})).toEqual(['id', 'name', 'covers', 'dishes'])
  })

  test('the resolve toolkit reads it back (meta survives derivations)', () => {
    const titled = z.string().min(2).meta({ title: 'Name' })
    // .min() returns a new schema, yet .meta() survives the derivation chain.
    expect(insane.resolveTitle(titled)).toBe('Name')
    expect(insane.boundsOf(z.array(z.string()).min(1).max(4))).toEqual({ min: 1, max: 4 })
  })
})
