/** The introspection toolkit: resolve + its partial applications. */
import { describe, it, expect } from 'vitest'
import * as z from 'zod'
import {
  resolve, resolveTitle, resolveComponent, resolveDefault, boundsOf, isOptional, isRequired,
} from '../src'
import { text } from '../examples/profile'

describe('resolve (curried walk, per-key, outer wins)', () => {
  const Email = text(z.string().email().meta({ title: 'Email' }))

  it('finds meta on the leaf and through wrappers', () => {
    expect(resolveTitle(Email)).toBe('Email')
    expect(resolveTitle(Email.optional())).toBe('Email')
  })

  it('per-use override on the wrapper beats the inner definition', () => {
    const o = Email.optional().meta({ title: 'Work email' })
    expect(resolveTitle(o)).toBe('Work email')
    expect(resolveComponent(o)).toBeDefined() // component still found inner — per-key independence
  })

  it('meta survives same-type derivation (.min) — plain-Zod chaining intact', () => {
    expect(resolveTitle(Email.min(2))).toBe('Email')
  })

  it('absence is undefined; the caller decides what it means', () => {
    expect(resolveTitle(z.string())).toBeUndefined()
  })

  it('is a reusable user-land primitive', () => {
    const isEmail = resolve<boolean>((_s, d) =>
      (d.checks ?? []).some((c) => (c as { _zod?: { def?: { format?: string } } })._zod?.def?.format === 'email') || undefined)
    expect(isEmail(z.string().email().optional())).toBe(true)
    expect(isEmail(z.string())).toBeUndefined()
  })
})

describe('total resolvers — no undefined where a default exists', () => {
  it('boundsOf: unbounded → 0/Infinity', () => {
    expect(boundsOf(z.array(z.string()))).toEqual({ min: 0, max: Infinity })
    expect(boundsOf(z.array(z.string()).min(1).max(3))).toEqual({ min: 1, max: 3 })
  })
  it('isOptional / isRequired are booleans', () => {
    expect(isOptional(z.string().optional())).toBe(true)
    expect(isOptional(z.string())).toBe(false)
    expect(isRequired(z.string())).toBe(true)
  })
  it('resolveDefault reads .default() through wrappers (thunks forced)', () => {
    expect(resolveDefault(z.number().default(5).optional())).toBe(5)
    expect(resolveDefault(z.string())).toBeUndefined()
  })
})
