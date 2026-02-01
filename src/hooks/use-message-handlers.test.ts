import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageHandlers } from './use-message-handlers'
import { Task } from '@/types/task'
import { TaskInfo, getNextMissingField } from '@/domain/task/task-fields'
import * as conversationService from '@/services/task-conversation-service'
import { taskService } from '@/services/task-service'
import { toast } from 'sonner'

// Mocks
vi.mock('@/services/task-conversation-service', () => ({
  mapSelectionToField: vi.fn(),
  generateNextQuestion: vi.fn(),
  canRegisterTask: vi.fn(),
}))

vi.mock('@/services/task-service', () => ({
  taskService: {
    create: vi.fn(),
  },
}))

vi.mock('@/types/chat', () => ({
  toTaskInfo: vi.fn((data) => data as TaskInfo),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/domain/task/task-fields', () => ({
  getNextMissingField: vi.fn(),
}))

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: 'user-1',
  title: 'テストタスク',
  category: 'work',
  status: 'inbox',
  deadline: null,
  scheduledDate: null,
  scheduledTime: null,
  durationMinutes: null,
  rawInput: 'テストタスク',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  completedAt: null,
  ...overrides,
})

const createMockTaskInfo = (overrides: Partial<TaskInfo> = {}): TaskInfo => ({
  title: 'テストタスク',
  category: 'work',
  deadline: null,
  scheduledDate: null,
  scheduledTime: null,
  durationMinutes: null,
  ...overrides,
})

describe('useMessageHandlers', () => {
  const mockAddUserMessage = vi.fn()
  const mockAddAssistantMessage = vi.fn()
  const mockAddSystemMessage = vi.fn()
  const mockProcessInput = vi.fn()
  const mockUpdateField = vi.fn()
  const mockSetCurrentField = vi.fn()
  const mockSetIsLoading = vi.fn()
  const mockSetIsFirstInput = vi.fn()
  const mockReset = vi.fn()
  const mockOnTaskCreated = vi.fn()
  const mockPendingTaskInfo = { current: null as TaskInfo | null }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPendingTaskInfo.current = null
    
    // Reset mock implementations
    ;(conversationService.generateNextQuestion as Mock).mockReturnValue({
      field: 'category',
      question: 'カテゴリを選んでください',
      options: ['仕事', '個人', '買い物'],
    })
    ;(conversationService.mapSelectionToField as Mock).mockReturnValue({
      success: true,
      field: 'category',
      value: 'work',
      nextField: null,
    })
    ;(conversationService.canRegisterTask as Mock).mockReturnValue(true)
    ;(getNextMissingField as Mock).mockReturnValue('deadline')
  })

  const createHookProps = (overrides: Partial<Parameters<typeof useMessageHandlers>[0]> = {}) => ({
    userId: 'user-1',
    conversation: {
      currentField: null as string | null,
      currentTaskInfo: createMockTaskInfo(),
    },
    isFirstInput: true,
    pendingTaskInfo: mockPendingTaskInfo,
    onTaskCreated: mockOnTaskCreated,
    addUserMessage: mockAddUserMessage,
    addAssistantMessage: mockAddAssistantMessage,
    addSystemMessage: mockAddSystemMessage,
    processInput: mockProcessInput,
    updateField: mockUpdateField,
    setCurrentField: mockSetCurrentField,
    setIsLoading: mockSetIsLoading,
    setIsFirstInput: mockSetIsFirstInput,
    reset: mockReset,
    ...overrides,
  })

  describe('handleSendMessage', () => {
    it('should add user message and set loading', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))

      mockProcessInput.mockResolvedValueOnce({
        result: { taskInfo: createMockTaskInfo() },
        isComplete: true,
      })

      await act(async () => {
        await result.current.handleSendMessage('テストメッセージ', {})
      })

      expect(mockAddUserMessage).toHaveBeenCalledWith('テストメッセージ')
      expect(mockSetIsLoading).toHaveBeenCalledWith(true)
      expect(mockSetIsLoading).toHaveBeenLastCalledWith(false)
    })

    it('should handle complete parsing and show confirmation', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))
      const taskInfo = createMockTaskInfo({ title: '買い物に行く' })

      mockProcessInput.mockResolvedValueOnce({
        result: { taskInfo },
        isComplete: true,
      })

      ;(conversationService.generateNextQuestion as Mock).mockReturnValueOnce({
        field: null,
        question: '',
        options: [],
      })

      await act(async () => {
        await result.current.handleSendMessage('買い物に行く', {})
      })

      expect(mockPendingTaskInfo.current).toEqual(taskInfo)
      expect(mockSetIsFirstInput).toHaveBeenCalledWith(false)
      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: '以下のタスクを登録しますか？',
        type: 'confirmation',
        taskInfo,
        options: ['登録する', '登録しない'],
      })
    })

    it('should handle incomplete parsing and ask next question', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))
      const partialTaskInfo = createMockTaskInfo({ category: null })

      mockProcessInput.mockResolvedValueOnce({
        result: { taskInfo: partialTaskInfo },
        isComplete: false,
      })

      // Mock returns options with 'スキップ' and 'とりあえず登録' appended by generateNextQuestion
      ;(conversationService.generateNextQuestion as Mock).mockReturnValueOnce({
        field: 'category',
        question: 'カテゴリを選んでください',
        options: ['仕事', '個人', '買い物', 'スキップ', 'とりあえず登録'],
      })

      await act(async () => {
        await result.current.handleSendMessage('タスク', {})
      })

      // taskInfo should have detected fields marked as null by detectFieldsInInput
      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: 'カテゴリを選んでください',
        type: 'question',
        taskInfo: expect.objectContaining({
          category: null,
          deadline: null,
          durationMinutes: null,
          scheduledDate: null,
          scheduledTime: null,
          title: 'テストタスク',
        }),
        options: ['仕事', '個人', '買い物', 'スキップ', 'とりあえず登録'],
      })
    })

    it('should handle first input with follow-up question', async () => {
      const props = createHookProps({ isFirstInput: true })
      const { result } = renderHook(() => useMessageHandlers(props))
      const taskInfo = createMockTaskInfo()

      mockProcessInput.mockResolvedValueOnce({
        result: { taskInfo },
        isComplete: true,
      })

      // generateNextQuestion now returns options with 'スキップ' and 'とりあえず登録' appended
      ;(conversationService.generateNextQuestion as Mock).mockReturnValueOnce({
        field: 'deadline',
        question: '締切はいつですか？',
        options: ['今日', '明日', '来週', 'スキップ', 'とりあえず登録'],
      })

      await act(async () => {
        await result.current.handleSendMessage('ミーティング', {})
      })

      expect(mockSetIsFirstInput).toHaveBeenCalledWith(false)
      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: '締切はいつですか？',
        type: 'question',
        taskInfo: expect.objectContaining({ category: 'work', deadline: null, title: 'テストタスク' }),
        options: ['今日', '明日', '来週', 'スキップ', 'とりあえず登録'],
      })
    })

    it('should continue asking questions until all fields are filled', async () => {
      const props = createHookProps({ isFirstInput: false })
      const { result } = renderHook(() => useMessageHandlers(props))

      mockProcessInput.mockResolvedValueOnce({
        result: { taskInfo: createMockTaskInfo() },
        isComplete: true,
      })

      // generateNextQuestion now returns options with 'スキップ' and 'とりあえず登録' appended
      ;(conversationService.generateNextQuestion as Mock).mockReturnValueOnce({
        field: 'deadline',
        question: '締切はいつですか？',
        options: ['今日', '明日', 'スキップ', 'とりあえず登録'],
      })

      await act(async () => {
        await result.current.handleSendMessage('タスク', {})
      })

      // isFirstInputがfalseでも確認画面に行かず、質問を続ける
      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: '締切はいつですか？',
        type: 'question',
        taskInfo: expect.any(Object),
        options: ['今日', '明日', 'スキップ', 'とりあえず登録'],
      })
    })

    it('should handle process error gracefully', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))

      mockProcessInput.mockRejectedValueOnce(new Error('Parse error'))

      await act(async () => {
        await result.current.handleSendMessage('タスク', {})
      })

      expect(toast.error).toHaveBeenCalledWith('タスクの解析に失敗しました')
      expect(mockAddSystemMessage).toHaveBeenCalledWith(
        '申し訳ありません。解析に失敗しました。もう一度入力してください。',
        'initial'
      )
      expect(mockSetIsLoading).toHaveBeenLastCalledWith(false)
    })
  })

  describe('handleSelectOption', () => {
    it('should handle cancel option', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))

      const response = await act(async () => {
        return await result.current.handleSelectOption('登録しない')
      })

      expect(response).toEqual({ type: 'cancelled' })
      expect(mockAddSystemMessage).toHaveBeenCalledWith(
        'タスクの登録をキャンセルしました。',
        'cancelled'
      )
    })

    it('should handle register option successfully', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))
      const taskInfo = createMockTaskInfo()
      const newTask = createMockTask({ id: 'new-task-1' })

      mockPendingTaskInfo.current = taskInfo
      ;(taskService.create as Mock).mockResolvedValueOnce(newTask)

      const response = await act(async () => {
        return await result.current.handleSelectOption('登録する')
      })

      expect(taskService.create).toHaveBeenCalledWith(taskInfo, 'user-1')
      expect(mockOnTaskCreated).toHaveBeenCalledWith(newTask)
      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: 'タスクを登録しました！',
        type: 'complete',
        taskInfo,
        isComplete: true,
      })
      expect(mockReset).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('タスクを追加しました')
      expect(response).toEqual({ type: 'registered', task: newTask })
    })

    it('should handle incomplete task registration error', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))

      mockPendingTaskInfo.current = createMockTaskInfo({ title: '' })
      ;(conversationService.canRegisterTask as Mock).mockReturnValueOnce(false)

      const response = await act(async () => {
        return await result.current.handleSelectOption('登録する')
      })

      expect(taskService.create).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('タスク情報が不完全です')
      expect(response).toEqual({ type: 'error' })
    })

    it('should handle registration service error', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))

      mockPendingTaskInfo.current = createMockTaskInfo()
      ;(taskService.create as Mock).mockRejectedValueOnce(new Error('DB error'))

      const response = await act(async () => {
        return await result.current.handleSelectOption('登録する')
      })

      expect(toast.error).toHaveBeenCalledWith('タスクの登録に失敗しました')
      expect(response).toEqual({ type: 'error' })
    })

    it('should map option to field and continue conversation', async () => {
      const props = createHookProps({
        conversation: {
          currentField: 'category',
          currentTaskInfo: createMockTaskInfo(),
        },
      })
      const { result } = renderHook(() => useMessageHandlers(props))

      ;(conversationService.mapSelectionToField as Mock).mockReturnValueOnce({
        success: true,
        field: 'category',
        value: 'personal',
        nextField: 'deadline',
      })

      ;(conversationService.generateNextQuestion as Mock).mockReturnValueOnce({
        field: 'deadline',
        question: '締切はいつですか？',
        options: ['今日', '明日'],
      })

      const response = await act(async () => {
        return await result.current.handleSelectOption('個人')
      })

      expect(mockUpdateField).toHaveBeenCalledWith('category', 'personal')
      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: '締切はいつですか？',
        type: 'question',
        taskInfo: expect.any(Object),
        options: ['今日', '明日'],
      })
      expect(response).toEqual({ type: 'continue' })
    })

    it('should fall back to send_message for invalid option', async () => {
      const props = createHookProps({
        conversation: {
          currentField: null,
          currentTaskInfo: createMockTaskInfo(),
        },
      })
      const { result } = renderHook(() => useMessageHandlers(props))

      ;(conversationService.mapSelectionToField as Mock).mockReturnValueOnce({
        success: false,
        field: null,
        value: null,
        nextField: null,
      })

      const response = await act(async () => {
        return await result.current.handleSelectOption('無効な選択')
      })

      expect(response).toEqual({ type: 'send_message', message: '無効な選択' })
    })

    it('should show confirmation when no more fields to ask', async () => {
      const props = createHookProps({
        conversation: {
          currentField: 'category',
          currentTaskInfo: createMockTaskInfo(),
        },
      })
      const { result } = renderHook(() => useMessageHandlers(props))

      ;(conversationService.mapSelectionToField as Mock).mockReturnValueOnce({
        success: true,
        field: 'category',
        value: 'work',
        nextField: null,
      })

      ;(conversationService.generateNextQuestion as Mock).mockReturnValueOnce({
        field: null,
        question: '',
        options: [],
      })

      await act(async () => {
        await result.current.handleSelectOption('仕事')
      })

      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: '以下のタスクを登録しますか？',
        type: 'confirmation',
        taskInfo: expect.any(Object),
        options: ['登録する', '登録しない'],
      })
    })

    it('should use conversation task info when pending is null', async () => {
      const props = createHookProps({
        conversation: {
          currentField: null,
          currentTaskInfo: createMockTaskInfo({ title: '会議' }),
        },
      })
      const { result } = renderHook(() => useMessageHandlers(props))
      const newTask = createMockTask({ id: 'task-2', title: '会議' })

      mockPendingTaskInfo.current = null
      ;(taskService.create as Mock).mockResolvedValueOnce(newTask)

      await act(async () => {
        await result.current.handleSelectOption('登録する')
      })

      expect(taskService.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: '会議' }),
        'user-1'
      )
    })

    it('should handle "とりあえず登録" option successfully', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))
      const taskInfo = createMockTaskInfo({ title: '買い物', category: 'shopping' })
      const newTask = createMockTask({ id: 'new-task-2' })

      mockPendingTaskInfo.current = taskInfo
      ;(conversationService.mapSelectionToField as Mock).mockReturnValueOnce({
        success: false,
        field: null,
        value: null,
        nextField: null,
        action: 'register_anyway',
      })
      ;(taskService.create as Mock).mockResolvedValueOnce(newTask)

      const response = await act(async () => {
        return await result.current.handleSelectOption('とりあえず登録')
      })

      expect(taskService.create).toHaveBeenCalledWith(taskInfo, 'user-1')
      expect(mockOnTaskCreated).toHaveBeenCalledWith(newTask)
      expect(mockAddAssistantMessage).toHaveBeenCalledWith({
        content: 'タスクを登録しました！',
        type: 'complete',
        taskInfo,
        isComplete: true,
      })
      expect(mockReset).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('タスクを追加しました')
      expect(response).toEqual({ type: 'registered', task: newTask })
    })

    it('should reject "とりあえず登録" when title is missing', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))

      mockPendingTaskInfo.current = createMockTaskInfo({ title: '', category: 'work' })
      ;(conversationService.mapSelectionToField as Mock).mockReturnValueOnce({
        success: false,
        field: null,
        value: null,
        nextField: null,
        action: 'register_anyway',
      })

      const response = await act(async () => {
        return await result.current.handleSelectOption('とりあえず登録')
      })

      expect(taskService.create).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('タスクのタイトルとカテゴリが必要です')
      expect(response).toEqual({ type: 'error' })
    })

    it('should reject "とりあえず登録" when category is missing', async () => {
      const props = createHookProps()
      const { result } = renderHook(() => useMessageHandlers(props))

      mockPendingTaskInfo.current = createMockTaskInfo({ title: 'タスク', category: '' })
      ;(conversationService.mapSelectionToField as Mock).mockReturnValueOnce({
        success: false,
        field: null,
        value: null,
        nextField: null,
        action: 'register_anyway',
      })

      const response = await act(async () => {
        return await result.current.handleSelectOption('とりあえず登録')
      })

      expect(taskService.create).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('タスクのタイトルとカテゴリが必要です')
      expect(response).toEqual({ type: 'error' })
    })

    it('should call setCurrentField after selecting an option', async () => {
      const props = createHookProps({
        conversation: {
          currentField: 'category',
          currentTaskInfo: createMockTaskInfo(),
        },
      })
      const { result } = renderHook(() => useMessageHandlers(props))

      ;(conversationService.mapSelectionToField as Mock).mockReturnValueOnce({
        success: true,
        field: 'category',
        value: 'work',
        nextField: 'deadline',
      })

      ;(getNextMissingField as Mock).mockReturnValueOnce('deadline')

      await act(async () => {
        await result.current.handleSelectOption('仕事')
      })

      expect(mockSetCurrentField).toHaveBeenCalledWith('deadline')
    })
  })
})
