import { describe, it, expect } from 'vitest'
import project from './project'

describe('project', () => {
  const obj = {
    name: 'John Doe',
    age: 25,
    address: {
      street: '123 Main St',
      city: 'New York',
    },
    hobbies: ['reading', 'gaming'],
  }

  it('should limit fields of the object', () => {
    const result = project(obj, {
      name: 1,
      age: 0,
      'address.city': 1,
      'address.zipCode': 0,
      hobbies: 1,
    })

    expect(result).toEqual({
      name: 'John Doe',
      address: {
        city: 'New York',
      },
      hobbies: ['reading', 'gaming'],
    })
  })

  it('should limit fields by disabling fields', () => {
    const result = project(obj, {
      age: 0,
      address: 0,
    })

    expect(result).toEqual({
      name: 'John Doe',
      hobbies: ['reading', 'gaming'],
    })
  })

  it('should remove nulls if deactivated', () => {
    const result = project({ foo: null }, { foo: 0 })
    expect(result).toEqual({})
  })

  it('should handle nested fields that do not exist in the object', () => {
    const result = project(obj, {
      'address.zipCode': 1,
    })

    expect(result).toEqual({})
  })

  it('should handle an empty object', () => {
    const result = project({}, {
      name: 1,
    })

    expect(result).toEqual({})
  })
})
