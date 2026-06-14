'use client'
import { createContext, type ReactNode, useContext } from 'react'
import { reactHookFormAdapter } from './adapters/react-hook-form'
import type { FormAdapter } from './types'

/**
 * The active form-engine adapter, delivered by context so deeply-nested leaf
 * and array renderers can read it at render time — the engine is a per-render
 * concern, not a property of the schema (which is why this is context and not a
 * Zod registry). Defaults to react-hook-form, so existing code needs no
 * Provider; wrap a subtree in <InsaneProvider adapter={…}> to swap engines.
 */
// `Form` is invariant in FormAdapter (produced by useForm, consumed by
// Provider/onSubmit), so a concrete FormAdapter<RhfForm> is not *assignable* to
// FormAdapter<unknown>. The core only ever feeds a form instance back into the
// SAME adapter that produced it, so erasing the parameter here is sound — the
// single cast at this boundary is what keeps every render seam type-safe.
const AdapterContext = createContext<FormAdapter>(reactHookFormAdapter as FormAdapter<unknown>)

export const useAdapter = (): FormAdapter => useContext(AdapterContext)

export function InsaneProvider<F>({
  adapter,
  children,
}: {
  adapter: FormAdapter<F>
  children: ReactNode
}) {
  return (
    <AdapterContext.Provider value={adapter as FormAdapter<unknown>}>
      {children}
    </AdapterContext.Provider>
  )
}
