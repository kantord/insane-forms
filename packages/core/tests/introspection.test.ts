/**
 * introspection.test.ts — PROOF of the four PUBLIC introspection resolvers that
 * read facts back off a Zod schema's wrapper chain. They all sit on the one
 * `resolve` primitive (outer→inner walk, first non-undefined wins, a wrapper is
 * anything with an `innerType`). This file pins their CONTRACTS:
 *   - resolveMeta(key)   — per-key meta lookup, NEAREST (outer) definition wins,
 *                          undefined when the key is absent everywhere.
 *   - resolveInner(s)    — peels optional/default/readonly/… down to the first
 *                          non-wrapper (object/array/leaf); a bare leaf is itself.
 *   - resolveDescription — thin alias for resolveMeta('description').
 *   - isReadonly(s)      — true iff a `.readonly()` wrapper rides the chain,
 *                          including when buried under other wrappers.
 */
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as insane from '../src'

describe('resolveMeta', () => {
  test('reads a meta value declared on a leaf', () => {
    const s = z.string().meta({ title: 'Name' })
    expect(insane.resolveMeta('title')(s)).toBe('Name')
  })

  test('returns undefined when the key is absent', () => {
    expect(insane.resolveMeta('title')(z.string())).toBeUndefined()
    // meta present, but not this key.
    expect(insane.resolveMeta('description')(z.string().meta({ title: 'Name' }))).toBeUndefined()
  })

  test('NEAREST definition wins: an outer wrapper overrides an inner one', () => {
    // Inner leaf says 'inner'; the optional() wrapper around it says 'outer'.
    // The walk visits the outer wrapper first, so 'outer' wins.
    const s = z.string().meta({ title: 'inner' }).optional().meta({ title: 'outer' })
    expect(insane.resolveMeta('title')(s)).toBe('outer')
  })

  test('falls through to the inner definition when the outer wrapper has none', () => {
    // The wrapper carries no title; the resolver keeps walking to the leaf.
    const s = z.string().meta({ title: 'inner' }).optional()
    expect(insane.resolveMeta('title')(s)).toBe('inner')
  })
})

describe('resolveInner', () => {
  test('unwraps optional().default() down to the underlying leaf', () => {
    const s = z.string().optional().default('x')
    const inner = insane.resolveInner(s)
    // The unwrapped schema parses like a bare ZodString: strings pass, numbers fail.
    expect(inner.safeParse('hello').success).toBe(true)
    expect(inner.safeParse(123).success).toBe(false)
    // It is NOT the optional/default wrapper: undefined no longer parses.
    expect(inner.safeParse(undefined).success).toBe(false)
  })

  test('a bare leaf resolves to itself', () => {
    const leaf = z.string()
    expect(insane.resolveInner(leaf)).toBe(leaf)
  })

  test('reaches the object under wrappers (a non-wrapper container)', () => {
    const obj = z.object({ a: z.string() })
    const inner = insane.resolveInner(obj.optional())
    expect(inner.safeParse({ a: 'x' }).success).toBe(true)
    expect(inner.safeParse(undefined).success).toBe(false)
  })
})

describe('resolveDescription', () => {
  test('returns the .meta({ description }) value', () => {
    const s = z.string().meta({ description: 'Your full name' })
    expect(insane.resolveDescription(s)).toBe('Your full name')
  })

  test('returns undefined when no description is declared', () => {
    expect(insane.resolveDescription(z.string().meta({ title: 'Name' }))).toBeUndefined()
  })
})

describe('isReadonly', () => {
  test('true for a readonly leaf', () => {
    expect(insane.isReadonly(z.string().readonly())).toBe(true)
  })

  test('true when readonly is nested under other wrappers', () => {
    expect(insane.isReadonly(z.string().readonly().optional())).toBe(true)
  })

  test('false for a plain leaf with no readonly wrapper', () => {
    expect(insane.isReadonly(z.string())).toBe(false)
    expect(insane.isReadonly(z.string().optional().default('x'))).toBe(false)
  })
})
