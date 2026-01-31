import { describe, it, expect } from 'vitest'
import { mapOptionToFieldValue, parseTimeFromInput } from './task-fields'

describe('mapOptionToFieldValue', () => {
  describe('category mapping', () => {
    it('should map Japanese category options to English values', () => {
      expect(mapOptionToFieldValue('買い物', 'category')).toEqual({ value: 'shopping', success: true })
      expect(mapOptionToFieldValue('返信', 'category')).toEqual({ value: 'reply', success: true })
      expect(mapOptionToFieldValue('仕事', 'category')).toEqual({ value: 'work', success: true })
      expect(mapOptionToFieldValue('個人', 'category')).toEqual({ value: 'personal', success: true })
      expect(mapOptionToFieldValue('その他', 'category')).toEqual({ value: 'other', success: true })
    })

    it('should fallback to "other" for unknown categories', () => {
      expect(mapOptionToFieldValue('不明', 'category')).toEqual({ value: 'other', success: false })
    })
  })

  describe('duration mapping', () => {
    it('should map duration options to minutes', () => {
      expect(mapOptionToFieldValue('15分', 'durationMinutes')).toEqual({ value: 15, success: true })
      expect(mapOptionToFieldValue('30分', 'durationMinutes')).toEqual({ value: 30, success: true })
      expect(mapOptionToFieldValue('1時間', 'durationMinutes')).toEqual({ value: 60, success: true })
      expect(mapOptionToFieldValue('2時間以上', 'durationMinutes')).toEqual({ value: 120, success: true })
    })

    it('should map "不明" to null', () => {
      expect(mapOptionToFieldValue('不明', 'durationMinutes')).toEqual({ value: null, success: true })
    })
  })

  describe('unknown fields', () => {
    it('should return null for unknown field names', () => {
      expect(mapOptionToFieldValue('value', 'unknown')).toEqual({ value: null, success: false })
    })
  })
})

describe('parseTimeFromInput', () => {
  it('should parse "14時" format', () => {
    expect(parseTimeFromInput('14時')).toEqual({ hour: 14, minute: 0 })
  })

  it('should parse "14時30分" format', () => {
    expect(parseTimeFromInput('14時30分')).toEqual({ hour: 14, minute: 30 })
  })

  it('should parse "14:00" format', () => {
    expect(parseTimeFromInput('14:00')).toEqual({ hour: 14, minute: 0 })
  })

  it('should parse "午前9時" format', () => {
    expect(parseTimeFromInput('午前9時')).toEqual({ hour: 9, minute: 0 })
  })

  it('should parse "午後2時" format', () => {
    expect(parseTimeFromInput('午後2時')).toEqual({ hour: 14, minute: 0 })
  })

  it('should handle "午後12時" correctly (no double addition)', () => {
    expect(parseTimeFromInput('午後12時')).toEqual({ hour: 12, minute: 0 })
  })

  it('should return null for invalid time', () => {
    expect(parseTimeFromInput('invalid')).toBeNull()
    expect(parseTimeFromInput('25時')).toBeNull()
  })
})
