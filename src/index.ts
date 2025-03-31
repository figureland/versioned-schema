import {
  literal,
  object,
  parse as valibotParse,
  union,
  type BaseSchema,
  type InferOutput,
  type BaseIssue
} from 'valibot'

type Version = `${number}`

type SchemaRecord = Record<string, BaseSchema<any, any, BaseIssue<any>>>

export const createVersionedSchema = <
  Base extends SchemaRecord,
  Versions extends Record<Version, SchemaRecord>,
  K extends keyof Versions
>({
  base,
  versions
}: {
  base: Base
  versions: Versions
}) => {
  type CombinedType = {
    [V in keyof Versions]: {
      [B in keyof Base]: InferOutput<Base[B]>
    } & {
      // @ts-expect-error Tricky type inference
      [F in keyof Versions[V]]: InferOutput<Versions[V][F]>
    } & { version: V }
  }[keyof Versions]

  /**
   * Combined union of all schema versions.
   */
  const schema = union(
    Object.entries(versions).map(([version, fields]) =>
      object({
        ...base,
        ...fields,
        version: literal(version as string)
      })
    )
  ) as unknown as BaseSchema<CombinedType, CombinedType, BaseIssue<CombinedType>>

  const parse = (v: unknown) => valibotParse(schema, v) as CombinedType

  const validate = (v: unknown): v is CombinedType => {
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
  ): value is CombinedType & { version: Ve } => {
    try {
      const parsed = parse(value)
      return parsed.version === version
    } catch {
      return false
    }
  }

  /**
   * Returns the latest schema version (the last key in the versions object).
   *
   * @example
   * ```ts
   * const { getLatestVersion } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(getLatestVersion()) // '2'
   * ```
   *
   * @returns The latest version string
   */
  const getLatestVersion = () => {
    const versionKeys = Object.keys(versions)
    return versionKeys[versionKeys.length - 1] as K
  }

  return {
    schema,
    parse,
    validate,
    isVersion,
    versions: Object.keys(versions) as K[],
    getLatestVersion
  }
}

export type VersionedSchema<
  S extends BaseSchema<any, any, any> = any,
  ST extends InferOutput<S> = any,
  V extends string | number | symbol = any
> = {
  /**
   * Creates a versioned {@link Schema.Schema}
   *
   * @example
   * ```ts
   * const { schema } = createVersionedSchema({ base: {}, versions: { '1': {}, '2': {} } })
   * console.log(schema) // Schema.Schema<{ version: '1' | '2' } & { [K in keyof Base]: Schema.Schema.Type<Base[K]> } & { [K in keyof Versions['1']]: Schema.Schema.Type<Versions['1'][K]> } & { [K in keyof Versions['2']]: Schema.Schema.Type<Versions['2'][K]> }>
   * ```
   *
   * @param base - The base schema, which is permanent and shared to all versions.
   * @param versions - Named versions of the schema, each with their own fields.
   * @returns - A versioned schema with methods to parse, validate, and check if a value is a valid instance of a specific version.
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
   *
   * @param v - The value to parse.
   * @returns - The parsed value.
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
   *
   * @param v - The value to validate.
   * @returns - `true` if the value is valid, `false` otherwise.
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
   *
   * @param version - The version to check against.
   * @param value - The value to validate.
   * @returns - True if the value is valid for the given version, false otherwise.
   */
  isVersion: (v: V, u: unknown) => u is ST & { version: V }
}

export type SchemaVersionNumbers<T> = T extends VersionedSchema<any, any, infer V> ? V : never

export type OptionalizeUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | undefined : T[K]
} extends infer O
  ? { [K in keyof O as undefined extends O[K] ? K : never]?: O[K] } & {
      [K in keyof O as undefined extends O[K] ? never : K]: O[K]
    }
  : never

export type InferVersionedSchema<T extends { schema: BaseSchema<any, any, any> }> =
  OptionalizeUndefined<InferOutput<T['schema']>>
