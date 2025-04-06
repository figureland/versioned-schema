import { describe, expect, it } from 'bun:test'
import { z } from 'zod'
import { createVersionedSchema, type InferVersionedSchema } from './zod'

describe('createVersionedSchema', () => {
  const baseSchema = {
    id: z.string(),
    createdAt: z.number()
  }

  const v1Fields = {
    name: z.string()
  }

  const v2Fields = {
    name: z.string(),
    description: z.string()
  }

  const testSchema = createVersionedSchema({
    base: baseSchema,
    versions: {
      '1': v1Fields,
      '2': v2Fields
    }
  })

  type TestSchema = InferVersionedSchema<typeof testSchema>

  describe('schema', () => {
    it('should create a valid schema', () => {
      expect(testSchema.schema).toBeDefined()
      expect(testSchema.versions).toEqual(['1', '2'])
    })
  })

  describe('parse', () => {
    it('should parse valid v1 data', () => {
      const validV1Data: TestSchema = {
        id: 'test-id',
        createdAt: 123456789,
        name: 'Test Name',
        version: '1'
      }
      expect(() => testSchema.parse(validV1Data)).not.toThrow()
      expect(testSchema.parse(validV1Data)).toEqual(validV1Data)
    })

    it('should parse valid v2 data', () => {
      const validV2Data: TestSchema = {
        id: 'test-id',
        createdAt: 123456789,
        name: 'Test Name',
        description: 'Test Description',
        version: '2'
      }
      expect(() => testSchema.parse(validV2Data)).not.toThrow()
      expect(testSchema.parse(validV2Data)).toEqual(validV2Data)
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
          metadata: z.object({
            tags: z.array(z.string())
          })
        },
        versions: {
          '1': {
            data: z.object({
              value: z.number()
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
          required: z.string()
        },
        versions: {
          '1': {
            optional: z.string().optional()
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
        id: z.string()
      },
      versions: {
        '1': { name: z.string() },
        '2': { name: z.string(), description: z.string() },
        '3': { name: z.string(), description: z.array(z.string()) }
      }
    })

    expect(schema.latest).toBe('3')
  })

  it('should work with a single version', () => {
    const schema = createVersionedSchema({
      base: {
        id: z.string()
      },
      versions: {
        '1': { name: z.string() }
      }
    })

    expect(schema.latest).toBe('1')
  })
})
