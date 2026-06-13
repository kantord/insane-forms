'use client'
export * from './insane'
// Public type surface (declarations live in ./types — compile-time only, no runtime).
// Internal types (guards, shape-merge machinery) stay unexported.
export type {
  CollectionItem,
  CollectionProps,
  CollectionWrapper,
  Def,
  FieldMeta,
  FieldProps,
  FieldSpec,
  ListOpts,
  NodeProps,
  PropsMapper,
  QueryParam,
  Shell,
  ShellProps,
  Widget,
} from './types'
