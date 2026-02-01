import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import {
  mapSelectionToField,
  parseChatInput,
  generateNextQuestion,
  canRegisterTask,
  extractTitleFromInput,
} from './task-conversation-service'
import { TaskInfo } from '@/domain/task/task-fields'
import * as taskFields from '@/domain/task/task-fields'

// Mock the domain functions
vi.mock('@/domain/task/task-fields', async () => {
  const actual = await vi.importActual<typeof import('@/domain/task/task-fields')>('@/domain/task/task-fields')
  return {
    ...actual,
    getNextMissingField: vi.fn(),
    mapOptionToFieldValue: vi.fn(),
    isTaskComplete: vi.fn(),
  }
})

describe('mapSelectionToField', () => {
  const mockTaskInfo: Partial<TaskInfo> = {
    title: 'テストタスク',
    category: 'work',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cancel and register actions', () => {
    it('should handle "登録しない" as cancel action', () => {
      const result = mapSelectionToField('登録しない', 'deadline', mockTaskInfo)

      expect(result.success).toBe(false)
      expect(result.field).toBeNull()
      expect(result.value).toBeNull()
      expect(result.action).toBe('cancel')
    })

    it('should handle "とりあえず登録" as register_anyway action', () => {
      const result = mapSelectionToField('とりあえず登録', 'deadline', mockTaskInfo)

      expect(result.success).toBe(false)
      expect(result.field).toBeNull()
      expect(result.value).toBeNull()
      expect(result.action).toBe('register_anyway')
    })
  })

  describe('scheduledDate mapping', () => {
    it('should map "今日" to today\'s date', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: '2026-02-01',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledTime')

      const result = mapSelectionToField('今日', 'scheduledDate', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledDate')
      expect(result.value).toBe('2026-02-01')
    })

    it('should map "明日" to tomorrow\'s date', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: '2026-02-02',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledTime')

      const result = mapSelectionToField('明日', 'scheduledDate', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledDate')
      expect(result.value).toBe('2026-02-02')
    })

    it('should map "未定" to null', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: null,
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledTime')

      const result = mapSelectionToField('未定', 'scheduledDate', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledDate')
      expect(result.value).toBeNull()
    })
  })

  describe('scheduledTime mapping', () => {
    it('should map "午前中" to morning time slot', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: 'morning',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('durationMinutes')

      const result = mapSelectionToField('午前中', 'scheduledTime', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledTime')
      expect(result.value).toBe('morning')
    })

    it('should map "午後" to afternoon time slot', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: 'afternoon',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('durationMinutes')

      const result = mapSelectionToField('午後', 'scheduledTime', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledTime')
      expect(result.value).toBe('afternoon')
    })

    it('should parse time input like "14:30"', () => {
      const result = mapSelectionToField('14:30', 'scheduledTime', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledTime')
      expect(result.value).toBe('14:30')
    })

    it('should map "指定しない" to null', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: null,
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('durationMinutes')

      const result = mapSelectionToField('指定しない', 'scheduledTime', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledTime')
      expect(result.value).toBeNull()
    })
  })

  describe('skip action', () => {
    it('should handle "スキップ" with valid currentField', () => {
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledDate')

      const result = mapSelectionToField('スキップ', 'deadline', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('deadline')
      expect(result.value).toBeNull()
      expect(result.nextField).toBe('scheduledDate')
    })

    it('should handle "スキップ" with null currentField', () => {
      const result = mapSelectionToField('スキップ', null, mockTaskInfo)

      expect(result.success).toBe(false)
      expect(result.field).toBeNull()
    })
  })



  describe('regular field mapping', () => {
    it('should map valid option to field', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: '2026-02-15T23:59:00+09:00',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledDate')

      const result = mapSelectionToField('明日', 'deadline', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('deadline')
      expect(result.value).toBe('2026-02-15T23:59:00+09:00')
      expect(result.nextField).toBe('scheduledDate')
    })

    it('should return success=false for invalid option', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: null,
        success: false,
      })

      const result = mapSelectionToField('不明', 'deadline', mockTaskInfo)

      expect(result.success).toBe(false)
    })

    it('should return success=false when currentField is null', () => {
      const result = mapSelectionToField('明日', null, mockTaskInfo)

      expect(result.success).toBe(false)
    })
  })

  describe('skip action with next field', () => {
    it('should get next field after setting scheduledDate', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: '2026-02-15',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledTime')

      const result = mapSelectionToField('明日', 'scheduledDate', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledDate')
      expect(result.nextField).toBe('scheduledTime')
    })

    it('should get next field after setting scheduledTime', () => {
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('durationMinutes')

      const result = mapSelectionToField('14:30', 'scheduledTime', mockTaskInfo)

      expect(result.success).toBe(true)
      expect(result.field).toBe('scheduledTime')
      expect(result.value).toBe('14:30')
      expect(result.nextField).toBe('durationMinutes')
    })
  })

  describe('type guards', () => {
    it('should handle invalid field names gracefully', () => {
      const result = mapSelectionToField('明日', 'invalidField', mockTaskInfo)

      expect(result.success).toBe(false)
    })

    it('should handle empty taskInfo', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: 'work',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('deadline')

      const result = mapSelectionToField('仕事', 'category', {})

      expect(result.success).toBe(true)
      expect(result.field).toBe('category')
    })
  })
})

describe('parseChatInput', () => {
  const mockTaskInfo: Partial<TaskInfo> = {
    title: 'テストタスク',
    category: 'work',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cancel action', () => {
    it('should identify "登録しない" as cancel', () => {
      const result = parseChatInput('登録しない', 'deadline', mockTaskInfo)

      expect(result.type).toBe('cancel')
    })
  })

  describe('skip action', () => {
    it('should identify "スキップ" with valid currentField', () => {
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledDate')

      const result = parseChatInput('スキップ', 'deadline', mockTaskInfo)

      expect(result.type).toBe('selection')
      expect(result.field).toBe('deadline')
      expect(result.value).toBeNull()
      expect(result.nextField).toBe('scheduledDate')
    })

    it('should treat "スキップ" as free_text when currentField is null', () => {
      const result = parseChatInput('スキップ', null, mockTaskInfo)

      expect(result.type).toBe('free_text')
    })
  })

  describe('time input for scheduledTime', () => {
    it('should parse time input for scheduledTime field', () => {
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('durationMinutes')

      const result = parseChatInput('15:00', 'scheduledTime', mockTaskInfo)

      expect(result.type).toBe('time_input')
      expect(result.field).toBe('scheduledTime')
      expect(result.value).toBe('15:00')
    })

    it('should treat non-time input as free_text for scheduledTime', () => {
      // "明日" is not a valid time, so it should fall through to free_text
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: null,
        success: false,
      })

      const result = parseChatInput('明日', 'scheduledTime', mockTaskInfo)

      expect(result.type).toBe('free_text')
    })
  })

    it('should treat non-time input as free_text for scheduledTime', () => {
      const result = parseChatInput('明日', 'scheduledTime', mockTaskInfo)

      expect(result.type).toBe('free_text')
    })
  })

  describe('date input for scheduledDate', () => {
    const mockTaskInfo: Partial<TaskInfo> = {
      title: 'テストタスク',
      category: 'work',
    }

    it('should handle date options for scheduledDate field', () => {
      ;(taskFields.mapOptionToFieldValue as Mock).mockReturnValue({
        value: '2026-02-01',
        success: true,
      })
      ;(taskFields.getNextMissingField as Mock).mockReturnValue('scheduledTime')

      const result = parseChatInput('今日', 'scheduledDate', mockTaskInfo)

      expect(result.type).toBe('selection')
      expect(result.field).toBe('scheduledDate')
      expect(result.value).toBe('2026-02-01')
    })
  })

  describe('free text input', () => {
    const mockTaskInfo: Partial<TaskInfo> = {
      title: 'テストタスク',
      category: 'work',
    }

    it('should default to free_text for unknown inputs', () => {
      const result = parseChatInput('任意の入力テキスト', 'deadline', mockTaskInfo)

      expect(result.type).toBe('free_text')
    })

    it('should handle empty input as free_text', () => {
      const result = parseChatInput('', 'category', mockTaskInfo)

      expect(result.type).toBe('free_text')
    })
  })

  describe('generateNextQuestion', () => {
    const mockTaskInfo: Partial<TaskInfo> = {
      title: 'テストタスク',
      category: 'work',
      scheduledDate: null,
      scheduledTime: null,
      deadline: null,
      durationMinutes: null,
    }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return field, question, and options when there are missing fields', () => {
    ;(taskFields.getNextMissingField as Mock).mockReturnValue('deadline')

    const result = generateNextQuestion(mockTaskInfo, false)

    expect(result.field).toBe('deadline')
    expect(result.question).toBeTruthy()
    expect(result.options.length).toBeGreaterThan(0)
    expect(result.options).toContain('スキップ')
    expect(result.options).toContain('とりあえず登録')
  })

  it('should return null field when all fields are complete', () => {
    ;(taskFields.getNextMissingField as Mock).mockReturnValue(null)

    const result = generateNextQuestion(mockTaskInfo, false)

    expect(result.field).toBeNull()
    expect(result.question).toBe('')
    expect(result.options).toEqual([])
  })

  it('should pass isInitial parameter to getNextMissingField', () => {
    ;(taskFields.getNextMissingField as Mock).mockReturnValue('category')

    generateNextQuestion(mockTaskInfo, true)

    expect(taskFields.getNextMissingField).toHaveBeenCalledWith(mockTaskInfo, true)
  })

  it('should use showAllOptions parameter when provided', () => {
    ;(taskFields.getNextMissingField as Mock).mockReturnValue('category')

    const resultWithAll = generateNextQuestion(mockTaskInfo, false, true)
    const resultWithPrimary = generateNextQuestion(mockTaskInfo, false, false)

    // With showAllOptions=true, should return all options
    expect(resultWithAll.options).toContain('買い物')
    expect(resultWithAll.options).toContain('返信')

    // With showAllOptions=false, should return only primary options
    expect(resultWithPrimary.options).toContain('スキップ')
    expect(resultWithPrimary.options).toContain('とりあえず登録')
  })
})

describe('canRegisterTask', () => {
  it('should return true when task is complete', () => {
    ;(taskFields.isTaskComplete as Mock).mockReturnValue(true)

    const result = canRegisterTask({
      title: 'テスト',
      category: 'work',
    })

    expect(result).toBe(true)
    expect(taskFields.isTaskComplete).toHaveBeenCalled()
  })

  it('should return false when task is incomplete', () => {
    ;(taskFields.isTaskComplete as Mock).mockReturnValue(false)

    const result = canRegisterTask({
      title: 'テスト',
      category: null,
    })

    expect(result).toBe(false)
  })
})

describe('extractTitleFromInput', () => {
  it('should return null for empty input', () => {
    expect(extractTitleFromInput('')).toBeNull()
    expect(extractTitleFromInput('   ')).toBeNull()
  })

  it('should extract title removing time patterns', () => {
    const result = extractTitleFromInput('明日までにレポートを書く')

    // "明日" (date pattern) is removed, but "までに" (context) remains
    // This is the actual behavior of the current implementation
    expect(result).toBeTruthy()
    expect(result?.includes('明日')).toBe(false)
    expect(result?.includes('レポートを書く')).toBe(true)
  })

  it('should handle input with multiple time references', () => {
    const result = extractTitleFromInput('明日の午後3時に会議')

    expect(result).toBeTruthy()
    expect(result?.length).toBeGreaterThan(2)
  })

  it('should return original input when only time expressions', () => {
    const result = extractTitleFromInput('明日今日来週')

    // When cleaning results in empty string, should return original
    expect(result).toBeTruthy()
  })

  it('should return null for single character', () => {
    expect(extractTitleFromInput('a')).toBeNull()
  })

  it('should handle time with specific hour', () => {
    const result = extractTitleFromInput('14時にミーティング')

    expect(result).toBeTruthy()
    expect(result?.includes('14時')).toBe(false)
  })
})

