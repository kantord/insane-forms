/**
 * schema-reader.test.ts — PROOF that `readSchema` is the faithful INVERSE of the
 * Zod builder: it reads BACK the facts a schema declared. Where the builder goes
 * `z.number().min(2)`, the reader goes `readSchema(...).number().min() === 2`.
 *
 * What this proves, per reader method:
 *  - number().min()/max() recover Zod 4's greater_than/less_than checks; an absent
 *    bound reads as undefined (absence is a first-class answer, not a throw).
 *  - string().length() recovers the length_equals check; a plain string is undefined.
 *  - enum().options() recovers the declared members, in order.
 *  - array().element() returns a reader for the ELEMENT schema, so the inversion
 *    is recursive (you can read the element's own declared facts).
 *  - placeholder() recovers a `.meta({ placeholder })`, else undefined.
 *  - The reader sees THROUGH wrapper chains (.optional(), .default()) to the leaf,
 *    because it resolves the inner schema before reading checks.
 */
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as insane from '../src'

describe('readSchema — the reverse reader of a Zod schema', () => {
  describe('number()', () => {
    test('.min()/.max() read back the declared bounds', () => {
      const r = insane.readSchema(z.number().min(2).max(9))
      expect(r.number().min()).toBe(2)
      expect(r.number().max()).toBe(9)
    })

    test('an absent bound reads as undefined', () => {
      const r = insane.readSchema(z.number().min(2))
      expect(r.number().min()).toBe(2)
      expect(r.number().max()).toBeUndefined()
    })

    test('a plain number declares no bounds', () => {
      const r = insane.readSchema(z.number())
      expect(r.number().min()).toBeUndefined()
      expect(r.number().max()).toBeUndefined()
    })
  })

  describe('string()', () => {
    test('.length() reads back the declared fixed length', () => {
      expect(insane.readSchema(z.string().length(6)).string().length()).toBe(6)
    })

    test('a plain string declares no fixed length', () => {
      expect(insane.readSchema(z.string()).string().length()).toBeUndefined()
    })
  })

  describe('enum()', () => {
    test('.options() reads back the declared members, in order', () => {
      expect(
        insane
          .readSchema(z.enum(['a', 'b', 'c']))
          .enum()
          .options(),
      ).toEqual(['a', 'b', 'c'])
    })
  })

  describe('array()', () => {
    test('.element() returns a reader for the element schema', () => {
      const r = insane.readSchema(z.array(z.number().min(1)))
      expect(r.array().element().number().min()).toBe(1)
    })

    test('the element reader is itself fully recursive (reads the element bounds)', () => {
      const r = insane.readSchema(z.array(z.number().min(3).max(7)))
      const element = r.array().element()
      expect(element.number().min()).toBe(3)
      expect(element.number().max()).toBe(7)
    })
  })

  describe('placeholder()', () => {
    test('reads back a .meta({ placeholder }) value', () => {
      expect(insane.readSchema(z.string().meta({ placeholder: 'x' })).placeholder()).toBe('x')
    })

    test('a schema without a placeholder reads as undefined', () => {
      expect(insane.readSchema(z.string()).placeholder()).toBeUndefined()
    })
  })

  describe('seeing through wrapper chains', () => {
    test('.optional() — the reader still reads the inner leaf bound', () => {
      expect(insane.readSchema(z.number().min(2).optional()).number().min()).toBe(2)
    })

    test('.default() — the reader still reads the inner leaf bound', () => {
      expect(insane.readSchema(z.number().min(2).default(5)).number().min()).toBe(2)
    })

    test('a wrapped enum still reads back its options', () => {
      expect(
        insane
          .readSchema(z.enum(['a', 'b']).optional())
          .enum()
          .options(),
      ).toEqual(['a', 'b'])
    })
  })
})
