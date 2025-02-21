import {
  BaseIssue,
  BaseSchema,
  InferOutput,
  literal,
  object,
  type ObjectEntries,
  parse as valibotParse,
  union
} from 'valibot'

type Version = `${number}`

export const createVersionedSchema = <
  Base extends ObjectEntries,
  Versions extends Record<Version, ObjectEntries>,
  K extends keyof Versions,
  SchemaInstance extends BaseSchema<
    {
      [K in keyof Versions]: {
        [F in keyof Base]: BaseSchema<Base[F], Base[F], BaseIssue<Base[F]>>
      } & {
        [F in keyof Versions[K]]: BaseSchema<
          Versions[K][F],
          Versions[K][F],
          BaseIssue<Versions[K][F]>
        >
      } & { version: K }
    }[keyof Versions],
    any,
    any
  >,
  SchemaInstanceType extends InferOutput<SchemaInstance>
>({
  base,
  versions
}: {
  base: Base
  versions: Versions
}) => {
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
  ) as unknown as SchemaInstance

  const parse = (v: unknown) => valibotParse(schema, v) as SchemaInstanceType

  const validate = (v: unknown): v is SchemaInstanceType => {
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
  ): value is SchemaInstanceType & { version: Ve } => {
    try {
      const parsed = parse(value)
      return parsed.version === version
    } catch {
      return false
    }
  }

  return {
    schema,
    parse,
    validate,
    isVersion,
    versions: Object.keys(versions) as K[]
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

export type VersionedSchemaType<
  T extends VersionedSchema,
  V extends string | undefined = undefined
> = V extends undefined
  ? T['schema'] extends BaseSchema<infer U, any, any>
    ? U
    : never
  : T['schema'] extends BaseSchema<infer U, any, any>
    ? Extract<U, { version: V }>
    : never

export type SchemaVersionNumbers<T> = T extends VersionedSchema<any, any, infer V> ? V : never
