import { describe, it, expect } from 'vitest'
import { isValidTitle, isTaskComplete, REQUIRED_FIELDS, OPTIONAL_FIELDS } from '@/domain/task/task-fields'
import type { TaskInfo } from '@/domain/task/task-fields'

describe('isValidTitle', () => {
  it('should return false for null', () => {
    expect(isValidTitle(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isValidTitle(undefined)).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidTitle('')).toBe(false)
  })

  it('should return false for whitespace only', () => {
    expect(isValidTitle('   ')).toBe(false)
  })

  it('should return false for invalid placeholder titles', () => {
    expect(isValidTitle('タイトル未定')).toBe(false)
    expect(isValidTitle('（タイトル未定）')).toBe(false)
    expect(isValidTitle('タイトルなし')).toBe(false)
  })

  it('should return true for valid Japanese titles', () => {
    expect(isValidTitle('新宿で山田とごはん')).toBe(true)
    expect(isValidTitle('お茶を買う')).toBe(true)
    expect(isValidTitle('明日までにレポートを書く')).toBe(true)
  })

  it('should return true for valid English titles', () => {
    expect(isValidTitle('Buy groceries')).toBe(true)
    expect(isValidTitle('Complete report')).toBe(true)
  })

  it('should handle edge case: empty string includes bug (previous bug)', () => {
    // このテストは以前のバグを検出する
    // "".includes("") は true を返すため、すべての文字列が無効と判定されていた
    const title = '新宿で山田とごはん'
    expect(isValidTitle(title)).toBe(true)
  })

  it('should return false for titles containing invalid substrings', () => {
    expect(isValidTitle('タイトル未定のタスク')).toBe(false)
    expect(isValidTitle('これはタイトルなしです')).toBe(false)
  })
})

describe('isTaskComplete', () => {
  const createTaskInfo = (overrides: Partial<TaskInfo> = {}): Partial<TaskInfo> => ({
    title: null,
    category: null,
    deadline: null,
    scheduledAt: null,
    durationMinutes: null,
    ...overrides,
  })

  it('should return false when title is missing', () => {
    const taskInfo = createTaskInfo({ category: 'personal' })
    expect(isTaskComplete(taskInfo)).toBe(false)
  })

  it('should return false when category is missing', () => {
    const taskInfo = createTaskInfo({ title: '新宿で山田とごはん' })
    expect(isTaskComplete(taskInfo)).toBe(false)
  })

  it('should return false when title is invalid', () => {
    const taskInfo = createTaskInfo({ title: 'タイトル未定', category: 'personal' })
    expect(isTaskComplete(taskInfo)).toBe(false)
  })

  it('should return true when both title and category are valid', () => {
    const taskInfo = createTaskInfo({ 
      title: '新宿で山田とごはん', 
      category: 'personal' 
    })
    expect(isTaskComplete(taskInfo)).toBe(true)
  })

  it('should return true even when optional fields are missing', () => {
    const taskInfo = createTaskInfo({ 
      title: 'お茶を買う', 
      category: 'shopping',
      deadline: null,
      scheduledAt: null,
      durationMinutes: null,
    })
    expect(isTaskComplete(taskInfo)).toBe(true)
  })

  it('should handle the exact bug case from production', () => {
    // 実際のバグケース: titleとcategoryがあるのに登録できなかった
    const taskInfo: Partial<TaskInfo> = {
      title: '新宿で山田とごはん',
      category: 'personal',
      scheduledAt: '2026-01-31T15:00:00+09:00',
      deadline: null,
      durationMinutes: null,
    }
    expect(isTaskComplete(taskInfo)).toBe(true)
  })
})

describe('Field Constants', () => {
  it('should have correct required fields', () => {
    expect(REQUIRED_FIELDS).toEqual(['title', 'category'])
  })

  it('should have correct optional fields', () => {
    expect(OPTIONAL_FIELDS).toEqual(['deadline', 'scheduledAt', 'durationMinutes'])
  })
})
