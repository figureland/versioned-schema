import { describe, expect, it } from 'bun:test'
import { Schema } from 'effect'
import { createVersionedSchema } from './effect'

describe('createVersionedSchema', () => {
  const baseSchema = {
    id: Schema.String,
    createdAt: Schema.Number
  }

  const v1Fields = {
    name: Schema.String
  }

  const v2Fields = {
    name: Schema.String,
    description: Schema.String
  }

  const testSchema = createVersionedSchema({
    base: baseSchema,
    versions: {
      '1': v1Fields,
      '2': v2Fields
    }
  })

  describe('schema', () => {
    it('should create a valid schema', () => {
      expect(testSchema.schema).toBeDefined()
      expect(testSchema.versions).toEqual(['1', '2'])
    })
  })

  describe('parse', () => {
    it('should parse valid v1 data', () => {
      const validV1Data = {
        id: 'test-id',
        createdAt: 123456789,
        name: 'Test Name',
        version: '1'
      }
      expect(() => testSchema.parse(validV1Data)).not.toThrow()
      expect(testSchema.parse(validV1Data)).toEqual(validV1Data as any)
    })

    it('should parse valid v2 data', () => {
      const validV2Data = {
        id: 'test-id',
        createdAt: 123456789,
        name: 'Test Name',
        description: 'Test Description',
        version: '2'
      }
      expect(() => testSchema.parse(validV2Data)).not.toThrow()
      expect(testSchema.parse(validV2Data)).toEqual(validV2Data as any)
    })

    it('should throw on invalid data', () => {
      const invalidData = {
        id: 'test-id',
        version: '1'
      }
      expect(() => testSchema.parse(invalidData)).toThrow()
    })

    it('should throw on invalid version', () => {
      const invalidVersion = {
        id: 'test-id',
        createdAt: 123456789,
        name: 'Test Name',
        version: '3'
      }
      expect(() => testSchema.parse(invalidVersion)).toThrow()
    })
  })

  describe('validate', () => {
    it('should return true for valid v1 data', () => {
      const validV1Data = {
        id: 'test-id',
        createdAt: 123456789,
        name: 'Test Name',
        version: '1'
      }
      expect(testSchema.validate(validV1Data)).toBe(true)
    })

    it('should return true for valid v2 data', () => {
      const validV2Data = {
        id: 'test-id',
        createdAt: 123456789,
        name: 'Test Name',
        description: 'Test Description',
        version: '2'
      }
      expect(testSchema.validate(validV2Data)).toBe(true)
    })

    it('should return false for invalid data', () => {
      const invalidData = {
        id: 'test-id',
        version: '1'
      }
      expect(testSchema.validate(invalidData)).toBe(false)
    })
  })

  describe('isVersion', () => {
    const validData = {
      id: 'test-id',
      createdAt: 123456789,
      name: 'Test Name',
      version: '1'
    }

    it('should return true for correct version check', () => {
      expect(testSchema.isVersion('1', validData)).toBe(true)
    })

    it('should return false for incorrect version check', () => {
      expect(testSchema.isVersion('2', validData)).toBe(false)
    })

    it('should return false for invalid data', () => {
      const invalidData = {
        id: 'test-id',
        version: '1'
      }
      expect(testSchema.isVersion('1', invalidData)).toBe(false)
    })
  })

  describe('complex schemas', () => {
    it('should handle nested schemas', () => {
      const nestedSchema = createVersionedSchema({
        base: {
          metadata: Schema.Struct({
            tags: Schema.Array(Schema.String)
          })
        },
        versions: {
          '1': {
            data: Schema.Struct({
              value: Schema.Number
            })
          }
        }
      })

      const validData = {
        metadata: {
          tags: ['test', 'example']
        },
        data: {
          value: 42
        },
        version: '1'
      }

      expect(() => nestedSchema.parse(validData)).not.toThrow()
      expect(nestedSchema.validate(validData)).toBe(true)
    })

    it('should handle optional fields', () => {
      const optionalSchema = createVersionedSchema({
        base: {
          required: Schema.String
        },
        versions: {
          '1': {
            optional: Schema.Union(Schema.String, Schema.Undefined)
          }
        }
      })

      const withOptional = {
        required: 'test',
        optional: 'present',
        version: '1'
      }

      const withoutOptional = {
        required: 'test',
        version: '1'
      }

      expect(() => optionalSchema.parse(withOptional)).not.toThrow()
      expect(() => optionalSchema.parse(withoutOptional)).not.toThrow()
      expect(optionalSchema.validate(withOptional)).toBe(true)
      expect(optionalSchema.validate(withoutOptional)).toBe(true)
    })
  })

  it('should return the latest version', () => {
    const schema = createVersionedSchema({
      base: {
        id: Schema.String
      },
      versions: {
        '1': { name: Schema.String },
        '2': { name: Schema.String, description: Schema.String },
        '3': { name: Schema.String, description: Schema.Array(Schema.String) }
      }
    })

    expect(schema.getLatestVersion()).toBe('3')
  })

  it('should work with a single version', () => {
    const schema = createVersionedSchema({
      base: {
        id: Schema.String
      },
      versions: {
        '1': { name: Schema.String }
      }
    })

    expect(schema.getLatestVersion()).toBe('1')
  })
})
