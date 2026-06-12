import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// RTL auto-cleanup hooks into a global afterEach, which we don't enable
// (globals: false) — so register it explicitly.
afterEach(cleanup)
