import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { parseTaskWithLLM } from './llm-parser-simple'
import OpenAI from 'openai'

// Create a singleton mock function that tests can configure
const mockCreate = vi.fn()

// Mock OpenAI with a singleton create function
vi.mock('openai', () => {
  return {
    default: vi.fn(function() {
      return {
        chat: {
          completions: {
            create: (...args: unknown[]) => mockCreate(...args),
          },
        },
      }
    }),
  }
})

describe('parseTaskWithLLM', () => {
  const mockConfig = {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    apiKey: 'test-api-key',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockReset()
  })

  describe('初回入力', () => {
    it('should parse basic task with title only', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '買い物に行く',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: null,
              category: 'shopping',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('買い物に行く', mockConfig)

      // LLMが返したタイトルをそのまま使用
      expect(result.taskInfo.title).toBe('買い物に行く')
      expect(result.taskInfo.category).toBe('shopping')
      expect(result.taskInfo.scheduledDate).toBeNull()
      expect(result.taskInfo.scheduledTime).toBeNull()
      expect(result.taskInfo.durationMinutes).toBeNull()
      // titleとcategoryが揃っているのでisCompleteはtrue
      expect(result.isComplete).toBe(true)
    })

    it('should parse task with durationMinutes', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '会議',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: 60,
              category: 'work',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('1時間の会議', mockConfig)

      expect(result.taskInfo.title).toBe('会議')
      expect(result.taskInfo.durationMinutes).toBe(60)
    })

    it('should parse complex task with all fields', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'レポートを書く',
              scheduledDate: '2026-02-02',
              scheduledTime: '14:00',
              deadline: '2026-02-02T23:59:00+09:00',
              durationMinutes: 180,
              category: 'work',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('明日の午後2時から3時間かけてレポートを書く', mockConfig)

      expect(result.taskInfo.title).toBe('レポートを書く')
      expect(result.taskInfo.scheduledDate).toBe('2026-02-02')
      expect(result.taskInfo.scheduledTime).toBe('14:00')
      expect(result.taskInfo.deadline).toBe('2026-02-02T23:59:00+09:00')
      expect(result.taskInfo.durationMinutes).toBe(180)
      expect(result.taskInfo.category).toBe('work')
    })

    it('should use input as fallback when title is empty', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: null,
              category: null,
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('明日の予定', mockConfig)

      // 空のtitleの場合、入力文字列がフォールバックとして使用される
      expect(result.taskInfo.title).toBe('明日の予定')
    })

    it('should handle invalid category gracefully', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'タスク',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: null,
              category: 'invalid_category',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('タスク', mockConfig)

      // 無効なカテゴリはnullとして扱われる
      expect(result.taskInfo.category).toBeNull()
    })

    it('should handle null durationMinutes', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'タスク',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: null,
              category: 'personal',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('タスク', mockConfig)

      expect(result.taskInfo.durationMinutes).toBeNull()
    })

    it('should reject zero duration', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'タスク',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: 0,
              category: 'personal',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('タスク', mockConfig)

      // 0は無効な値として扱われ、nullになる
      expect(result.taskInfo.durationMinutes).toBeNull()
    })
  })

  describe('継続入力', () => {
    it('should handle exact match with options locally', async () => {
      // "明日" は deadline フィールドの選択肢と完全一致 → ローカル処理
      const currentTaskInfo = {
        title: 'レポート',
        category: 'work' as const,
        scheduledDate: null,
        scheduledTime: null,
        deadline: null,
        durationMinutes: null,
      }

      const result = await parseTaskWithLLM(
        '明日',
        mockConfig,
        '前回のコンテキスト',
        currentTaskInfo,
        'deadline' // 現在のフィールド
      )

      // 選択肢と完全一致 → ローカル処理（変更なし）
      expect(result.taskInfo.title).toBe('レポート')
      expect(result.taskInfo.category).toBe('work')
      expect(result.isComplete).toBe(true)
    })

    it('should use LLM for input with additional information', async () => {
      // "明日11時" は "明日" と完全一致しない → LLM解析
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '会議',
              scheduledDate: '2026-02-02',
              scheduledTime: '11:00',
              deadline: null,
              durationMinutes: null,
              category: 'work',
            }),
          },
        }],
      })

      const currentTaskInfo = {
        title: '会議',
        category: 'work' as const,
        scheduledDate: null,
        scheduledTime: null,
        deadline: null,
        durationMinutes: null,
      }

      const result = await parseTaskWithLLM(
        '明日11時',
        mockConfig,
        '前回のコンテキスト',
        currentTaskInfo,
        'scheduledDate'
      )

      // 追加情報あり → LLM解析結果
      expect(result.taskInfo.title).toBe('会議')
      expect(result.taskInfo.scheduledDate).toBe('2026-02-02')
      expect(result.taskInfo.scheduledTime).toBe('11:00')
    })

    it('should handle special commands locally', async () => {
      const currentTaskInfo = {
        title: 'タスク',
        category: 'personal' as const,
        scheduledDate: null,
        scheduledTime: null,
        deadline: null,
        durationMinutes: null,
      }

      const result = await parseTaskWithLLM(
        '登録する',
        mockConfig,
        '前回のコンテキスト',
        currentTaskInfo,
        null
      )

      // 特殊コマンド → ローカル処理
      expect(result.taskInfo.title).toBe('タスク')
      expect(result.isComplete).toBe(true)
    })
  })

  describe('エラーハンドリング', () => {
    it('should return fallback result on API error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API Error'))

      const result = await parseTaskWithLLM('タスク', mockConfig)

      // エラー時はフォールバック結果が返される
      expect(result.taskInfo.title).toBe('タスク')
      expect(result.taskInfo.category).toBe('personal')
      expect(result.isComplete).toBe(true)
    })

    it('should return fallback when no response content', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      })

      const result = await parseTaskWithLLM('タスク', mockConfig)

      // contentがnullの場合、入力文字列がフォールバックとして使用される
      expect(result.taskInfo.title).toBe('タスク')
    })
  })

  describe('durationMinutes抽出', () => {
    it('should parse 1 hour as 60 minutes', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '作業',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: 60,
              category: 'work',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('1時間の作業', mockConfig)

      expect(result.taskInfo.durationMinutes).toBe(60)
    })

    it('should parse 2.5 hours as 150 minutes', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '会議',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: 150,
              category: 'work',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('2時間半の会議', mockConfig)

      expect(result.taskInfo.durationMinutes).toBe(150)
    })

    it('should reject negative duration', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'タスク',
              scheduledDate: null,
              scheduledTime: null,
              deadline: null,
              durationMinutes: -30,
              category: 'personal',
            }),
          },
        }],
      })

      const result = await parseTaskWithLLM('タスク', mockConfig)

      // 負の値は無効として扱われ、nullになる
      expect(result.taskInfo.durationMinutes).toBeNull()
    })
  })
})
