'use client'
// Form-engine adapters: react-hook-form is the default; swap via <InsaneProvider>.
export { reactHookFormAdapter, useZodForm } from './adapters/react-hook-form'
export { InsaneProvider, useAdapter } from './context'
export * from './insane'
// Public type surface (declarations live in ./types — compile-time only, no runtime).
// Internal types (guards, shape-merge machinery) stay unexported.
export type {
  ArrayBinding,
  ArrayRow,
  CollectionItem,
  CollectionProps,
  CollectionWrapper,
  Def,
  FieldBinding,
  FieldMeta,
  FieldProps,
  FieldSpec,
  FormAdapter,
  ListOpts,
  NodeProps,
  PropsMapper,
  QueryParam,
  Shell,
  ShellProps,
  Widget,
} from './types'
