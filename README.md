[![CI](https://github.com/figureland/versioned-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/figureland/versioned-schema/actions/workflows/ci.yml)
[![NPM](https://img.shields.io/npm/v/@figureland/versioned-schema?color=40bd5c)](https://img.shields.io/npm/v/@figureland/versioned-schema?color=40bd5c)

# versioned-schema

A tiny tool which allows you to create basic versioned schemas, using [valibot](https://valibot.dev/). This is handy when designing distributed apps and data structures.

This library can also be used with [effect/Schema](https://effect.website/docs/schema/introduction/).

## Explainer

Let's make up a scenario where we have a basic data structure in our app. We want to update it by adding a new field called `description`. And then later on, And later on, we decide to change the type of field `description` to be an array of strings.

In this scenario, we might end up with different versions of our data structure that can clash.

```ts
type Example = {
  id: string
  createdAt: number
  name: string
}

type Example2 = {
  id: string
  createdAt: number
  name: string
  description: string
}

type Example3 = {
  id: string
  createdAt: number
  name: string
  description: string[]
}
```

We want our app to be able to support different versions of this data structure. So we might end up with something like this:

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

These different versions can introduce a lot of complexity. This is not a new problem, and there are a lot of different approaches that tend to be application-specific.

This library provides some basic helpers to make it easier to work with that schema in your app.

### Create a versioned schema

```ts
import { number, string, array } from 'valibot'
import { createVersionedSchema } from '@figureland/versioned-schema'

const exampleSchema = createVersionedSchema({
  // Base schema - shared across all versions
  base: {
    id: string(),
    createdAt: number()
  },
  // Version-specific schemas
  versions: {
    '1': {
      name: string()
    },
    '2': {
      name: string(),
      description: string()
    },
    '3': {
      name: string(),
      description: array(string())
    }
  }
})

const { schema, versions, parse, validate, isVersion } = exampleSchema
```

### Infer the type of a schema

```ts
import type { InferOutput } from 'valibot'

type Example = InferOutput<typeof exampleSchema.schema>
```

### List available schema versions

```ts
// List available schema versions
console.log(exampleSchema.versions)
// ['1', '2', '3']
```

### Parse data

```ts
// Parse data
const v1Data = {
  id: '123',
  createdAt: Date.now(),
  name: 'Example V1',
  version: '1'
}
console.log(exampleSchema.parse(v1Data))
// { id: '123', createdAt: 1234567890, name: 'Example V1', version: '1' }

const v2Data = {
  id: '456',
  createdAt: Date.now(),
  name: 'Example V2',
  description: 'Version 2 has a description',
  version: '2'
}
console.log(exampleSchema.parse(v2Data))
// { id: '456', createdAt: 1234567890, name: 'Example V2', description: '...', version: '2' }
```

### Validate unknown data

```ts
// Check if data matches any version of your schema (type-safe)
console.log(exampleSchema.validate(v1Data)) // true
console.log(exampleSchema.validate({ version: '1' })) // false (missing required fields)

// Check if data is a specific version of your schema (type-safe)
console.log(exampleSchema.isVersion('1', v1Data)) // true
console.log(exampleSchema.isVersion('2', v1Data)) // false
```

### Use with effect/Schema

```ts
import { Schema } from 'effect'
import { createVersionedSchema } from '@figureland/versioned-schema/effect'
const exampleSchema = createVersionedSchema({
  base: {
    id: Schema.String,
    createdAt: Schema.Number
  }
})
```

### Use with zod

```ts
import { createVersionedSchema } from '@figureland/versioned-schema/zod'

const exampleSchema = createVersionedSchema({
  base: {
    id: z.string(),
    createdAt: z.number()
  },
  versions: {
    '1': {
      name: z.string()
    }
  }
})
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
