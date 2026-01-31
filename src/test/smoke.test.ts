import { describe, it, expect } from 'vitest'

describe('Test Environment', () => {
  it('should work', () => {
    expect(true).toBe(true)
  })

  it('should support Japanese text', () => {
    const text = '新宿で山田とごはん'
    expect(text).toContain('山田')
  })
})
