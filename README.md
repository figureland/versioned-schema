[![CI](https://github.com/figureland/versioned-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/figureland/versioned-schema/actions/workflows/ci.yml)
[![NPM](https://img.shields.io/npm/v/@figureland/versioned-schema?color=40bd5c)](https://img.shields.io/npm/v/@figureland/versioned-schema?color=40bd5c)

# versioned-schema

A tiny tool which allows you to create basic versioned schemas, using [effect/Schema](https://effect.website/docs/schema/introduction/). This is handy when designing distributed apps and data structures.

## Explainer

Let's start with a basic data structure.

```ts
type Example = {
  id: string
  createdAt: number
  name: string
}
```

We want to create a new version of it. We want to add a description field to it.

```ts
type Example = {
  id: string
  createdAt: number
  name: string
  description: string
}
```

And later on, we want `description` to be an array of strings.

```ts
type Example = {
  id: string
  createdAt: number
  name: string
  description: string[]
}
```

We want our app to be able to support different versions of this data structure. So we create a versioned schema and end up with this:

```ts
type Example =
  | {
      id: string
      createdAt: number
      name: string
      version: '1'
    }
  | {
      id: string
      createdAt: number
      name: string
      description: string
      version: '2'
    }
  | {
      id: string
      createdAt: number
      name: string
      description: string[]
      version: '3'
    }
```

We can use this library to create this. Provided are some little helpers to make it easier to work with that schema in your app.

#### Create a versioned schema

```ts
import { Schema } from 'effect'
import { createVersionedSchema } from '@figureland/versioned-schema'

const example = createVersionedSchema({
  // Base schema - shared across all versions
  base: {
    id: Schema.String,
    createdAt: Schema.Number
  },
  // Version-specific schemas
  versions: {
    '1': {
      name: Schema.String
    },
    '2': {
      name: Schema.String,
      description: Schema.String
    },
    '3': {
      name: Schema.String,
      description: Schema.Array(Schema.String)
    }
  }
})

// Note the helper of the example schema

const { schema, versions, parse, validate, isVersion } = example
```

#### Get the [effect/Schema](https://effect.website/docs/schema/introduction/) object

```ts
// Get the schema object
console.log(example.schema)
// Schema<{ version: '1' | '2' | '3' } & { id: string, createdAt: number } & ...>
```

#### List available schema versions

```ts
// List available schema versions
console.log(example.versions)
// ['1', '2', '3']
```

#### Parse data

```ts
// Parse data
const v1Data = {
  id: '123',
  createdAt: Date.now(),
  name: 'Example V1',
  version: '1'
}
console.log(example.parse(v1Data))
// { id: '123', createdAt: 1234567890, name: 'Example V1', version: '1' }

const v2Data = {
  id: '456',
  createdAt: Date.now(),
  name: 'Example V2',
  description: 'Version 2 has a description',
  version: '2'
}
console.log(example.parse(v2Data))
// { id: '456', createdAt: 1234567890, name: 'Example V2', description: '...', version: '2' }
```

#### Validate unknown data

```ts
// Check if data matches any version of your schema (type-safe)
console.log(example.validate(v1Data)) // true
console.log(example.validate({ version: '1' })) // false (missing required fields)

// Check if data is a specific version of your schema (type-safe)
console.log(example.isVersion('1', v1Data)) // true
console.log(example.isVersion('2', v1Data)) // false
```

#### Convert to JSON Schema

There are also some helpers to convert your schema into [JSON Schema](https://json-schema.org/specification) or [Standard Schema](<[StandardSchema](https://standardschema.dev/)>).

```ts
import { createStandardSchema, createJSONSchema } from '@figureland/versioned-schema/interchange'
import { example } from '.'

const json = createJSONSchema(example)

const standard = createStandardSchema(example)
```

## Scripts

### Install

```bash
bun install
```

### Test

```bash
bun test
```

### Build

```bash
bun run build
```
