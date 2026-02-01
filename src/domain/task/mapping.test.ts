import { describe, it, expect } from 'vitest'
import { mapOptionToFieldValue, parseTimeFromInput } from '@/domain/task/task-fields'

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

  describe('deadline mapping', () => {
    it('should map "今日" to today at 23:59 JST', () => {
      const result = mapOptionToFieldValue('今日', 'deadline')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:00\+09:00$/)
    })

    it('should map "明日" to tomorrow at 23:59 JST', () => {
      const result = mapOptionToFieldValue('明日', 'deadline')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:00\+09:00$/)
    })

    it('should map "今週中" to this Sunday at 23:59 JST', () => {
      const result = mapOptionToFieldValue('今週中', 'deadline')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:00\+09:00$/)
    })

    it('should map "来週" to next week at 23:59 JST', () => {
      const result = mapOptionToFieldValue('来週', 'deadline')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:00\+09:00$/)
    })

    it('should map "期限なし" to null', () => {
      expect(mapOptionToFieldValue('期限なし', 'deadline')).toEqual({ value: null, success: true })
    })

    it('should return failure for unknown deadline option', () => {
      expect(mapOptionToFieldValue('不明', 'deadline')).toEqual({ value: null, success: false })
    })
  })

  describe('scheduledDate mapping', () => {
    it('should map "今日" to today in YMD format', () => {
      const result = mapOptionToFieldValue('今日', 'scheduledDate')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should map "明日" to tomorrow in YMD format', () => {
      const result = mapOptionToFieldValue('明日', 'scheduledDate')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should map "今週中" to this Sunday in YMD format', () => {
      const result = mapOptionToFieldValue('今週中', 'scheduledDate')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should map "来週" to next Monday in YMD format', () => {
      const result = mapOptionToFieldValue('来週', 'scheduledDate')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should map "未定" to null', () => {
      expect(mapOptionToFieldValue('未定', 'scheduledDate')).toEqual({ value: null, success: true })
    })

    it('should map "指定しない" to null', () => {
      expect(mapOptionToFieldValue('指定しない', 'scheduledDate')).toEqual({ value: null, success: true })
    })

    it('should return failure for unknown scheduledDate option', () => {
      expect(mapOptionToFieldValue('不明', 'scheduledDate')).toEqual({ value: null, success: false })
    })
  })

  describe('scheduledTime mapping', () => {
    it('should map time slots correctly', () => {
      expect(mapOptionToFieldValue('午前中', 'scheduledTime')).toEqual({ value: 'morning', success: true })
      expect(mapOptionToFieldValue('昼', 'scheduledTime')).toEqual({ value: 'noon', success: true })
      expect(mapOptionToFieldValue('午後', 'scheduledTime')).toEqual({ value: 'afternoon', success: true })
      expect(mapOptionToFieldValue('夜', 'scheduledTime')).toEqual({ value: 'evening', success: true })
    })

    it('should map specific time in HH:mm format', () => {
      expect(mapOptionToFieldValue('14:30', 'scheduledTime')).toEqual({ value: '14:30', success: true })
      expect(mapOptionToFieldValue('9:00', 'scheduledTime')).toEqual({ value: '09:00', success: true })
      expect(mapOptionToFieldValue('23:59', 'scheduledTime')).toEqual({ value: '23:59', success: true })
    })

    it('should reject invalid time format', () => {
      expect(mapOptionToFieldValue('25:00', 'scheduledTime')).toEqual({ value: null, success: false })
      expect(mapOptionToFieldValue('14:60', 'scheduledTime')).toEqual({ value: null, success: false })
    })

    it('should map "未定" to null', () => {
      expect(mapOptionToFieldValue('未定', 'scheduledTime')).toEqual({ value: null, success: true })
    })

    it('should map "指定しない" to null', () => {
      expect(mapOptionToFieldValue('指定しない', 'scheduledTime')).toEqual({ value: null, success: true })
    })

    it('should return failure for unknown scheduledTime option', () => {
      expect(mapOptionToFieldValue('不明', 'scheduledTime')).toEqual({ value: null, success: false })
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
