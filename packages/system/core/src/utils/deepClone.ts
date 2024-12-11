export function clone<T>(value: T): T {
  // Functions
  if (typeof value === 'function') throw new Error('Cloning functions is not supported')

  // Check for null or primitive types (string, number, boolean, etc.)
  if (value === null || typeof value !== 'object') return value

  // Dates
  if (value instanceof Date) return new Date(value.getTime()) as T

  // Arrays
  if (Array.isArray(value)) return value.map(item => clone(item)) as T

  // Maps
  if (value instanceof Map) {
    const result = new Map()
    value.forEach((val, key) => {
      result.set(key, clone(val))
    })
    return result as T
  }

  // Sets
  if (value instanceof Set) {
    const result = new Set()
    value.forEach((val) => {
      result.add(clone(val))
    })
    return result as T
  }

  // RegExp
  if (value instanceof RegExp) return new RegExp(value) as T

  // plain objects
  const result: any = {}
  for (const key in value) {
    if (Object.hasOwnProperty.call(value, key)) {
      result[key] = clone(value[key])
    }
  }
  return result
}

export default function deepClone<T>(obj: T): T {
  // If structuredClone is available, use it
  if (typeof structuredClone === 'function') return structuredClone(obj)

  // Otherwise, perform a manual deep clone
  /* istanbul ignore next -- @preserve */
  return clone(obj)
}
