import { defineConfig } from 'tsdown'

export default defineConfig({
  // One published entry: the engine-agnostic core. Form-library bindings and the
  // `createFormRenderer` / form-wrapper sugar are userland examples, never shipped.
  entry: ['src/index.ts'],
  platform: 'neutral',
  dts: true,
  exports: true,
  // ...config options
})
