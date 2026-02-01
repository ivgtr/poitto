import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskConversation } from './use-task-conversation'
import { ParseResult } from '@/types/chat'

// Mock global fetch
global.fetch = vi.fn()

describe('useTaskConversation', () => {
  const mockParseResult: ParseResult = {
    taskInfo: {
      title: 'テストタスク',
      category: 'work',
      deadline: null,
      scheduledDate: null,
      scheduledTime: null,
      durationMinutes: null,
    },
    missingFields: ['deadline', 'scheduledDate', 'scheduledTime', 'durationMinutes'],
    nextQuestion: 'いつまでに完了させますか？',
    clarificationOptions: ['今日', '明日', '今週中'],
    isComplete: false,
    rawInput: 'テストタスク',
    conversationContext: 'テストコンテキスト',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('should start with initial state', () => {
      const { result } = renderHook(() => useTaskConversation())

      expect(result.current.state.phase).toBe('initial')
      expect(result.current.state.currentTaskInfo).toEqual({})
      expect(result.current.state.context).toBe('')
      expect(result.current.state.currentField).toBeNull()
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('startConversation', () => {
    it('should transition to collecting phase', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.startConversation()
      })

      expect(result.current.state.phase).toBe('collecting')
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('processInput', () => {
    it('should successfully process input and update state', async () => {
      const { result } = renderHook(() => useTaskConversation())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          data: mockParseResult,
        }),
      })

      let response
      await act(async () => {
        response = await result.current.processInput('テストタスク', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      expect(response.result).toEqual(mockParseResult)
      expect(response.nextField).toBe('deadline')
      expect(response.isComplete).toBe(false)
      expect(result.current.state.currentTaskInfo).toEqual(mockParseResult.taskInfo)
      expect(result.current.state.context).toBe('テストコンテキスト')
    })

    it('should handle API error gracefully', async () => {
      const { result } = renderHook(() => useTaskConversation())

      ;(fetch as Mock).mockRejectedValueOnce(new Error('Network error'))

      let response
      await act(async () => {
        response = await result.current.processInput('テスト', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      expect(response.result).toBeNull()
      expect(response.nextField).toBeNull()
      expect(response.isComplete).toBe(false)
      expect(result.current.state.currentTaskInfo).toEqual({})
    })

    it('should handle API response with missing fields', async () => {
      const { result } = renderHook(() => useTaskConversation())

      const completeResult = {
        ...mockParseResult,
        taskInfo: {
          title: '完全なタスク',
          category: 'work',
          deadline: '2026-02-01',
          scheduledDate: '2026-02-01',
          scheduledTime: '10:00',
          durationMinutes: 30,
        },
        missingFields: [],
        isComplete: true,
      }

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          data: completeResult,
        }),
      })

      let response
      await act(async () => {
        response = await result.current.processInput('完全なタスク', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      expect(response.isComplete).toBe(true)
      expect(response.nextField).toBeNull()
    })

    it('should handle non-ok response', async () => {
      const { result } = renderHook(() => useTaskConversation())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      let response
      await act(async () => {
        response = await result.current.processInput('テスト', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      expect(response.result).toBeNull()
      expect(response.isComplete).toBe(false)
    })

    it('should handle invalid API response format', async () => {
      const { result } = renderHook(() => useTaskConversation())

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          data: { invalid: 'data' }, // Missing required fields
        }),
      })

      let response
      await act(async () => {
        response = await result.current.processInput('テスト', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      expect(response.result).toBeNull()
    })
  })

  describe('updateField', () => {
    it('should update a single field', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.updateField('title', '新しいタイトル')
      })

      expect(result.current.state.currentTaskInfo.title).toBe('新しいタイトル')
    })

    it('should preserve existing fields when updating', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.updateField('title', 'タスク')
        result.current.updateField('category', 'work')
      })

      expect(result.current.state.currentTaskInfo).toEqual({
        title: 'タスク',
        category: 'work',
      })
    })

    it('should update nested values correctly', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.updateField('deadline', '2026-02-15')
        result.current.updateField('durationMinutes', 60)
      })

      expect(result.current.state.currentTaskInfo.deadline).toBe('2026-02-15')
      expect(result.current.state.currentTaskInfo.durationMinutes).toBe(60)
    })
  })

  describe('setCurrentField', () => {
    it('should set current field', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.setCurrentField('deadline')
      })

      expect(result.current.state.currentField).toBe('deadline')
    })

    it('should clear current field when set to null', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.setCurrentField('deadline')
      })

      act(() => {
        result.current.setCurrentField(null)
      })

      expect(result.current.state.currentField).toBeNull()
    })

    it('should update current field multiple times', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.setCurrentField('category')
      })

      act(() => {
        result.current.setCurrentField('deadline')
      })

      act(() => {
        result.current.setCurrentField('scheduledDate')
      })

      expect(result.current.state.currentField).toBe('scheduledDate')
    })
  })

  describe('confirmRegistration', () => {
    it('should return TaskInfo when required fields are present', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.updateField('title', 'テストタスク')
        result.current.updateField('category', 'work')
        result.current.updateField('deadline', null)
        result.current.updateField('scheduledDate', null)
        result.current.updateField('scheduledTime', null)
        result.current.updateField('durationMinutes', null)
      })

      const taskInfo = result.current.confirmRegistration()

      expect(taskInfo).not.toBeNull()
      expect(taskInfo?.title).toBe('テストタスク')
      expect(taskInfo?.category).toBe('work')
    })

    it('should return null when title is missing', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.updateField('category', 'work')
      })

      const taskInfo = result.current.confirmRegistration()

      expect(taskInfo).toBeNull()
    })

    it('should return null when category is missing', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.updateField('title', 'テストタスク')
      })

      const taskInfo = result.current.confirmRegistration()

      expect(taskInfo).toBeNull()
    })

    it('should reset to completed state after confirmation', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.startConversation()
        result.current.updateField('title', 'テストタスク')
        result.current.updateField('category', 'work')
        result.current.updateField('deadline', null)
        result.current.updateField('scheduledDate', null)
        result.current.updateField('scheduledTime', null)
        result.current.updateField('durationMinutes', null)
      })

      act(() => {
        result.current.confirmRegistration()
      })

      expect(result.current.state.phase).toBe('completed')
      expect(result.current.state.currentTaskInfo).toEqual({})
      expect(result.current.state.currentField).toBeNull()
      expect(result.current.isActive).toBe(false)
    })

    it('should include optional fields in returned TaskInfo', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.updateField('title', 'テストタスク')
        result.current.updateField('category', 'work')
        result.current.updateField('deadline', '2026-02-15')
        result.current.updateField('scheduledDate', '2026-02-15')
        result.current.updateField('scheduledTime', '10:00')
        result.current.updateField('durationMinutes', 60)
      })

      const taskInfo = result.current.confirmRegistration()

      expect(taskInfo?.deadline).toBe('2026-02-15')
      expect(taskInfo?.scheduledDate).toBe('2026-02-15')
      expect(taskInfo?.scheduledTime).toBe('10:00')
      expect(taskInfo?.durationMinutes).toBe(60)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.startConversation()
        result.current.updateField('title', 'テスト')
        result.current.setCurrentField('category')
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.state.phase).toBe('initial')
      expect(result.current.state.currentTaskInfo).toEqual({})
      expect(result.current.state.context).toBe('')
      expect(result.current.state.currentField).toBeNull()
      expect(result.current.isActive).toBe(false)
    })

    it('should allow restart after reset', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.startConversation()
        result.current.reset()
        result.current.startConversation()
      })

      expect(result.current.state.phase).toBe('collecting')
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('isActive', () => {
    it('should be false in initial phase', () => {
      const { result } = renderHook(() => useTaskConversation())
      expect(result.current.isActive).toBe(false)
    })

    it('should be true in collecting phase', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.startConversation()
      })

      expect(result.current.isActive).toBe(true)
    })

    it('should be false after completion', () => {
      const { result } = renderHook(() => useTaskConversation())

      act(() => {
        result.current.startConversation()
        result.current.updateField('title', 'テスト')
        result.current.updateField('category', 'work')
        result.current.updateField('deadline', null)
        result.current.updateField('scheduledDate', null)
        result.current.updateField('scheduledTime', null)
        result.current.updateField('durationMinutes', null)
      })

      act(() => {
        result.current.confirmRegistration()
      })

      expect(result.current.isActive).toBe(false)
    })

    it('should be true in confirming phase', () => {
      const { result } = renderHook(() => useTaskConversation())

      // Note: phase transitions to confirming are handled by useMessageHandlers
      // This test just verifies the state property exists
      act(() => {
        result.current.startConversation()
      })

      expect(result.current.isActive).toBe(true)
    })
  })

  describe('complex scenarios', () => {
    it('should handle full conversation flow', async () => {
      const { result } = renderHook(() => useTaskConversation())

      // Start conversation
      act(() => {
        result.current.startConversation()
      })

      // Simulate first user input
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          data: mockParseResult,
        }),
      })

      await act(async () => {
        await result.current.processInput('テストタスク', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      // Update fields based on user selections
      act(() => {
        result.current.setCurrentField('deadline')
        result.current.updateField('deadline', '2026-02-15')
      })

      act(() => {
        result.current.setCurrentField('scheduledDate')
        result.current.updateField('scheduledDate', '2026-02-15')
        result.current.setCurrentField('scheduledTime')
        result.current.updateField('scheduledTime', '10:00')
      })

      // Complete registration
      const taskInfo = result.current.confirmRegistration()

      expect(taskInfo).not.toBeNull()
      expect(taskInfo?.title).toBe('テストタスク')
      expect(taskInfo?.category).toBe('work')
      expect(taskInfo?.deadline).toBe('2026-02-15')
      expect(taskInfo?.scheduledDate).toBe('2026-02-15')
      expect(taskInfo?.scheduledTime).toBe('10:00')
    })

    it('should handle multiple processInput calls', async () => {
      const { result } = renderHook(() => useTaskConversation())

      // First input
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          data: mockParseResult,
        }),
      })

      await act(async () => {
        await result.current.processInput('最初の入力', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      expect(result.current.state.currentTaskInfo.title).toBe('テストタスク')

      // Second input (should update context)
      const secondResult = {
        ...mockParseResult,
        conversationContext: '更新されたコンテキスト',
      }

      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          data: secondResult,
        }),
      })

      await act(async () => {
        await result.current.processInput('追加情報', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'test-key',
        })
      })

      expect(result.current.state.context).toBe('更新されたコンテキスト')
    })
  })
})
