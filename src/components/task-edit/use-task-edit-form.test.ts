import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTaskEditForm } from './use-task-edit-form'
import type { Task } from '@/types/task'

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    userId: 'user-1',
    title: 'テストタスク',
    category: 'work',
    status: 'inbox',
    deadline: null,
    scheduledDate: null,
    scheduledAt: null,
    durationMinutes: null,
    rawInput: 'テストタスク',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  completedAt: null,
  ...overrides,
})

describe('useTaskEditForm', () => {
  const mockOnSave = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnSave.mockClear()
    mockOnClose.mockClear()
  })

  describe('初期値設定', () => {
    it('should initialize with task values', () => {
      const task = createMockTask({
        title: '既存タスク',
        category: 'personal',
      })

      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.title).toBe('既存タスク')
      expect(result.current.category).toBe('personal')
    })

    it('should format deadline to YYYY-MM-DD', () => {
      const task = createMockTask({
        deadline: new Date('2026-02-15T12:00:00'),
      })

      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.deadline).toBe('2026-02-15')
    })

    it('should format scheduledAt to date and time', () => {
      const task = createMockTask({
        scheduledAt: new Date('2026-03-20T14:30:00'),
      })

      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.scheduledDate).toBe('2026-03-20')
      expect(result.current.scheduledTime).toBe('14:30')
    })

    it('should use scheduledDate when scheduledAt is null', () => {
      const task = createMockTask({
        scheduledDate: '2026-04-10',
        scheduledAt: null,
      })

      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.scheduledDate).toBe('2026-04-10')
      expect(result.current.scheduledTime).toBe('')
    })

    it('should handle null dates', () => {
      const task = createMockTask({
        deadline: null,
        scheduledAt: null,
      })

      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.deadline).toBe('')
      expect(result.current.scheduledDate).toBe('')
      expect(result.current.scheduledTime).toBe('')
    })

    it('should convert durationMinutes to string', () => {
      const task = createMockTask({
        durationMinutes: 90,
      })

      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.durationMinutes).toBe('90')
    })
  })

  describe('状態更新', () => {
    it('should update title', () => {
      const task = createMockTask()
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      act(() => {
        result.current.setTitle('新しいタイトル')
      })

      expect(result.current.title).toBe('新しいタイトル')
    })

    it('should update category', () => {
      const task = createMockTask()
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      act(() => {
        result.current.setCategory('shopping')
      })

      expect(result.current.category).toBe('shopping')
    })
  })

  describe('handleSave', () => {
    it('should call onSave with correct data', async () => {
      const task = createMockTask({ id: 'task-123' })
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      // 値を変更
      act(() => {
        result.current.setTitle('更新されたタスク')
        result.current.setCategory('personal')
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(mockOnSave).toHaveBeenCalledWith('task-123', {
        title: '更新されたタスク',
        category: 'personal',
        deadline: null,
        scheduledDate: null,
        scheduledAt: null,
        durationMinutes: null,
      })
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should parse date and time correctly', async () => {
      const taskWithSchedule = createMockTask({
        id: 'task-456',
        scheduledAt: new Date('2026-05-10T09:30:00'),
      })

      const { result } = renderHook(() =>
        useTaskEditForm({ task: taskWithSchedule, onSave: mockOnSave, onClose: mockOnClose })
      )

      await act(async () => {
        await result.current.handleSave()
      })

      expect(mockOnSave).toHaveBeenCalledWith('task-456', expect.objectContaining({
        scheduledDate: '2026-05-10',
        scheduledAt: new Date('2026-05-10T09:30:00'),
      }))
    })

    it('should not save when title is empty', async () => {
      const task = createMockTask()
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      act(() => {
        result.current.setTitle('')
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should trim title before saving', async () => {
      const task = createMockTask({ id: 'task-789' })
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      act(() => {
        result.current.setTitle('  前後空白あり  ')
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(mockOnSave).toHaveBeenCalledWith('task-789', expect.objectContaining({
        title: '前後空白あり',
      }))
    })

    it('should set isLoading during save', async () => {
      const task = createMockTask()
      let resolveSave = (): void => {}
      let resolveSaveSet = false
      const slowOnSave = vi.fn().mockImplementation(() => 
        new Promise<void>(resolve => {
          resolveSave = resolve
          resolveSaveSet = true
        })
      )
      
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: slowOnSave, onClose: mockOnClose })
      )

      expect(result.current.isLoading).toBe(false)

      // Start save but don't await yet
      act(() => {
        result.current.handleSave()
      })

      // Wait for isLoading to become true
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the save promise
      if (resolveSaveSet) {
        resolveSave()
      }

      // Wait for isLoading to become false again
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('canSave', () => {
    it('should be true when title is not empty and not loading', () => {
      const task = createMockTask()
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.canSave).toBe(true)
    })

    it('should be false when title is empty', () => {
      const task = createMockTask({ title: '' })
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.canSave).toBe(false)
    })

    it('should be false when loading', async () => {
      const task = createMockTask()
      let resolveSave = (): void => {}
      let resolveSaveSet = false
      const slowOnSave = vi.fn().mockImplementation(() => 
        new Promise<void>(resolve => {
          resolveSave = resolve
          resolveSaveSet = true
        })
      )
      
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: slowOnSave, onClose: mockOnClose })
      )

      // Start save
      act(() => {
        result.current.handleSave()
      })

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Verify canSave is false during loading
      expect(result.current.canSave).toBe(false)

      // Cleanup
      if (resolveSaveSet) {
        resolveSave()
      }
    })
  })

  describe('クリア関数', () => {
    it('should clear deadline', () => {
      const task = createMockTask({
        deadline: new Date('2026-01-15'),
      })
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.deadline).toBe('2026-01-15')

      act(() => {
        result.current.clearDeadline()
      })

      expect(result.current.deadline).toBe('')
    })

    it('should clear scheduled date and time', () => {
      const task = createMockTask({
        scheduledAt: new Date('2026-02-20T10:00:00'),
      })
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.scheduledDate).toBe('2026-02-20')
      expect(result.current.scheduledTime).toBe('10:00')

      act(() => {
        result.current.clearScheduled()
      })

      expect(result.current.scheduledDate).toBe('')
      expect(result.current.scheduledTime).toBe('')
    })

    it('should clear duration', () => {
      const task = createMockTask({
        durationMinutes: 60,
      })
      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: mockOnSave, onClose: mockOnClose })
      )

      expect(result.current.durationMinutes).toBe('60')

      act(() => {
        result.current.clearDuration()
      })

      expect(result.current.durationMinutes).toBe('')
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle save error gracefully', async () => {
      const task = createMockTask()
      const errorOnSave = vi.fn().mockRejectedValue(new Error('保存失敗'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() =>
        useTaskEditForm({ task, onSave: errorOnSave, onClose: mockOnClose })
      )

      await act(async () => {
        await result.current.handleSave()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update task:', expect.any(Error))
      expect(mockOnClose).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
