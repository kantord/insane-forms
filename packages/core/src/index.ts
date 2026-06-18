'use client'
// Engine-agnostic core: schema builders, the matchless render runtime, the
// introspection toolkit, and URL codecs. No form library, no context, no global.
// Connect an engine with the FieldEngine contract (see ./types) and pass it to
// <Render engine={…}>; a ready-made react-hook-form binding + ZodForm wrapper
// live at "insane-forms/react-hook-form".
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
  Derive,
  FieldBinding,
  FieldEngine,
  FieldMeta,
  FieldProps,
  FieldSpec,
  ListOpts,
  NodeProps,
  QueryParam,
  SchemaReader,
  Shell,
  ShellProps,
  Widget,
} from './types'
