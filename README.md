[![CI](https://github.com/figureland/versioned-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/figureland/versioned-schema/actions/workflows/ci.yml)
[![NPM](https://img.shields.io/npm/v/@figureland/versioned-schema?color=40bd5c)](https://img.shields.io/npm/v/@figureland/versioned-schema?color=40bd5c)

# versioned-schema

This tool allows you to create basic versioned schemas. It is based on [effect/Schema](https://effect.website/docs/schema/introduction/). This comes in hand when designing distributed apps and data structures, where you want to create a process for dealing with

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
    }
  }
})

// Get the schema object
console.log(example.schema)
// Schema<{ version: '1' | '2' } & { id: string, createdAt: number } & ...>

// List available schema versions
console.log(example.versions)
// ['1', '2']

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

// Check if data matches any version of your schema (type-safe)
console.log(example.validate(v1Data)) // true
console.log(example.validate({ version: '1' })) // false (missing required fields)

// Check if data is a specific version of your schema (type-safe)
console.log(example.isVersion('1', v1Data)) // true
console.log(example.isVersion('2', v1Data)) // false
```

You can also use the `interchange` module to convert your schema into [JSON Schema](https://json-schema.org/specification) or [Standard Schema](<[StandardSchema](https://standardschema.dev/)>).

```ts
import { createStandardSchema, createJSONSchema } from '@figureland/versioned-schema'
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
