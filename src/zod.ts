import { z } from 'zod'
import { OptionalizeUndefined } from '.'

type Version = number | string

export const createVersionedSchema = <
  Base extends Record<string, z.ZodType<any>>,
  Versions extends Record<Version, Record<string, z.ZodType<any>>>,
  K extends keyof Versions,
  SchemaInstance extends z.ZodType<
    {
      [K in keyof Versions]: {
        [F in keyof Base]: z.infer<Base[F]>
      } & {
        [F in keyof Versions[K]]: z.infer<Versions[K][F]>
      } & { version: K }
    }[keyof Versions]
  >
>({
  base = {} as Base,
  versions
}: {
  base?: Base
  versions: Versions
}) => {
  /**
   * Combined union of all schema versions.
   */
  const schema = z.union(
    // @ts-expect-error tricky zod type inference
    Object.entries(versions).map(([version, fields]) =>
      z.object({
        ...base,
        ...fields,
        version: z.literal(version as string)
      })
    )
  )

  const parse = (v: unknown) => schema.parse(v)

  const validate = (v: unknown): v is z.infer<SchemaInstance> => {
    try {
      parse(v)
      return true
    } catch {
      return false
    }
  }

  const isVersion = <Ve extends keyof Versions>(
    version: Ve,
    value: unknown
  ): value is z.infer<SchemaInstance> & { version: Ve } => {
    try {
      const parsed = parse(value)
      return parsed.version === version
    } catch {
      return false
    }
  }

  const versionKeys = Object.keys(versions)
  const latest = versionKeys[versionKeys.length - 1] as K

  return {
    schema,
    parse,
    validate,
    isVersion,
    versions: Object.keys(versions) as K[],
    latest
  }
}

export type VersionedSchema<
  S extends z.ZodType<any> = any,
  ST extends z.infer<S> = any,
  V extends string | number = any
> = {
  /**
   * Creates a versioned {@link z.ZodType}
   *
   * @example
   * ```ts
   * const { schema } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(schema) // z.ZodType<{ version: '1' | '2' } & { [K in keyof Base]: z.infer<Base[K]> } & { [K in keyof Versions['1']]: z.infer<Versions['1'][K]> } & { [K in keyof Versions['2']]: z.infer<Versions['2'][K]> }>
   * ```
   */
  schema: S
  /**
   * All known versions of the schema.
   *
   * @example
   * ```ts
   * const { versions } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(versions) // ['1', '2']
   * ```
   */
  versions: V[]
  /**
   * Parses the given value against the schema.
   *
   * @example
   * ```ts
   * const { parse } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(parse({ version: '1', ... })) // { version: '1', ... }
   * console.log(parse({ version: '2', ... })) // { version: '2', ... }
   * console.log(parse()) // throws Error
   * ```
   */
  parse: (v: unknown) => ST
  /**
   * Validates if the given value conforms to the schema.
   *
   * @example
   * ```ts
   * const { validate } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(validate({ version: '1', ... })) // true
   * console.log(validate({ version: '2', ... })) // false
   * ```
   */
  validate: (v: unknown) => v is ST
  /**
   * Checks if the given value is a valid instance of the schema for a specific version.
   *
   * @example
   * ```ts
   * const { isVersion } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(isVersion('1', { version: '1', ... })) // true
   * console.log(isVersion('2', { version: '1', ... })) // false
   * ```
   */
  isVersion: (v: V, u: unknown) => u is ST & { version: V }
  /**
   * The latest version of the schema.
   *
   * @example
   * ```ts
   * const { latest } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(latest) // '2'
   */
  latest: V
}

export type VersionedSchemaType<
  T extends VersionedSchema,
  V extends string | undefined = undefined
> = V extends undefined
  ? T['schema'] extends z.ZodType<infer U>
    ? U
    : never
  : T['schema'] extends z.ZodType<infer U>
    ? Extract<U, { version: V }>
    : never

export type SchemaVersionNumbers<T> = T extends VersionedSchema<any, any, infer V> ? V : never

export type InferVersionedSchema<T extends { schema: z.ZodType<any> }> = OptionalizeUndefined<
  z.infer<T['schema']>
>
