import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTask, getTasks, updateTaskStatus, scheduleTask } from './tasks'

// Next.jsのキャッシュ関数をモック
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Repositoryをモック
vi.mock('@/infrastructure/persistence/prisma-task-repository', () => ({
  createTaskInDB: vi.fn(),
  getTasksFromDB: vi.fn(),
  updateTaskStatusInDB: vi.fn(),
  scheduleTaskInDB: vi.fn(),
}))

import {
  createTaskInDB,
  getTasksFromDB,
  updateTaskStatusInDB,
  scheduleTaskInDB,
} from '@/infrastructure/persistence/prisma-task-repository'
import type { Task } from '@/types/task'

describe('Task Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTasks', () => {
    it('should return tasks from repository', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          userId: 'user-1',
          title: 'タスク1',
          category: 'work',
          status: 'scheduled',
          scheduledAt: new Date('2026-01-31T10:00:00'),
          deadline: null,
          durationMinutes: 30,
          rawInput: 'タスク1',
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        },
      ]

      vi.mocked(getTasksFromDB).mockResolvedValue(mockTasks)

      const result = await getTasks('user-1', ['inbox', 'scheduled'])

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTasks)
      expect(getTasksFromDB).toHaveBeenCalledWith('user-1', ['inbox', 'scheduled'])
    })

    it('should return error when userId is empty', async () => {
      const result = await getTasks('', [])

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('UNAUTHORIZED')
    })

    it('should return error when repository throws', async () => {
      vi.mocked(getTasksFromDB).mockRejectedValue(new Error('DB Error'))

      const result = await getTasks('user-1', ['inbox', 'scheduled'])

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should return empty array when status is empty', async () => {
      const result = await getTasks('user-1', [])

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(getTasksFromDB).not.toHaveBeenCalled()
    })

    it('should pass filtered status to repository', async () => {
      const mockTasks: Task[] = []
      vi.mocked(getTasksFromDB).mockResolvedValue(mockTasks)

      const result = await getTasks('user-1', ['scheduled', 'unknown', 'done'])

      expect(result.success).toBe(true)
      expect(getTasksFromDB).toHaveBeenCalledWith('user-1', ['scheduled', 'done'])
    })
  })

  describe('createTask', () => {
    it('should create task and revalidate', async () => {
      const mockTask: Task = {
        id: '1',
        userId: 'user-1',
        title: '新しいタスク',
        category: 'personal',
        status: 'inbox',
        scheduledAt: null,
        deadline: null,
        durationMinutes: null,
        rawInput: '新しいタスク',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      }

      vi.mocked(createTaskInDB).mockResolvedValue(mockTask)

      const result = await createTask('user-1', {
        title: '新しいタスク',
        category: 'personal',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTask)
      expect(createTaskInDB).toHaveBeenCalledWith('user-1', {
        title: '新しいタスク',
        category: 'personal',
      })
    })

    it('should create scheduled task with dates', async () => {
      const scheduledAt = new Date('2026-01-31T15:00:00')
      const deadline = new Date('2026-02-01')

      const mockTask: Task = {
        id: '2',
        userId: 'user-1',
        title: '期限付きタスク',
        category: 'work',
        status: 'scheduled',
        scheduledAt,
        deadline,
        durationMinutes: 60,
        rawInput: '期限付きタスク',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      }

      vi.mocked(createTaskInDB).mockResolvedValue(mockTask)

      const result = await createTask('user-1', {
        title: '期限付きタスク',
        category: 'work',
        scheduledAt,
        deadline,
        durationMinutes: 60,
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('scheduled')
      expect(createTaskInDB).toHaveBeenCalledWith('user-1', {
        title: '期限付きタスク',
        category: 'work',
        scheduledAt,
        deadline,
        durationMinutes: 60,
      })
    })

    it('should return error when userId is empty', async () => {
      const result = await createTask('', {
        title: 'タスク',
        category: 'personal',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('UNAUTHORIZED')
    })

    it('should return error when title is empty', async () => {
      const result = await createTask('user-1', {
        title: '',
        category: 'personal',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('MISSING_REQUIRED_FIELD')
    })

    it('should return error when repository throws', async () => {
      vi.mocked(createTaskInDB).mockRejectedValue(new Error('DB Error'))

      const result = await createTask('user-1', {
        title: 'タスク',
        category: 'personal',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('updateTaskStatus', () => {
    it('should update task status to done', async () => {
      const mockTask: Task = {
        id: '1',
        userId: 'user-1',
        title: 'タスク',
        category: 'work',
        status: 'done',
        scheduledAt: null,
        deadline: null,
        durationMinutes: null,
        rawInput: 'タスク',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      }

      vi.mocked(updateTaskStatusInDB).mockResolvedValue(mockTask)

      const result = await updateTaskStatus('1', 'done')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('done')
      expect(result.data?.completedAt).toBeInstanceOf(Date)
      expect(updateTaskStatusInDB).toHaveBeenCalledWith('1', 'done')
    })

    it('should update task status to inbox', async () => {
      const mockTask: Task = {
        id: '1',
        userId: 'user-1',
        title: 'タスク',
        category: 'work',
        status: 'inbox',
        scheduledAt: null,
        deadline: null,
        durationMinutes: null,
        rawInput: 'タスク',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      }

      vi.mocked(updateTaskStatusInDB).mockResolvedValue(mockTask)

      const result = await updateTaskStatus('1', 'inbox')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('inbox')
      expect(result.data?.completedAt).toBeNull()
    })

    it('should return error when taskId is empty', async () => {
      const result = await updateTaskStatus('', 'done')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('INVALID_INPUT')
    })

    it('should return error when repository throws', async () => {
      vi.mocked(updateTaskStatusInDB).mockRejectedValue(new Error('DB Error'))

      const result = await updateTaskStatus('1', 'done')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('scheduleTask', () => {
    it('should schedule task with datetime', async () => {
      const scheduledAt = new Date('2026-01-31T14:00:00')

      const mockTask: Task = {
        id: '1',
        userId: 'user-1',
        title: 'タスク',
        category: 'work',
        status: 'scheduled',
        scheduledAt,
        deadline: null,
        durationMinutes: null,
        rawInput: 'タスク',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      }

      vi.mocked(scheduleTaskInDB).mockResolvedValue(mockTask)

      const result = await scheduleTask('1', scheduledAt)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('scheduled')
      expect(result.data?.scheduledAt).toEqual(scheduledAt)
      expect(scheduleTaskInDB).toHaveBeenCalledWith('1', scheduledAt)
    })

    it('should return error when taskId is empty', async () => {
      const scheduledAt = new Date('2026-01-31T14:00:00')
      const result = await scheduleTask('', scheduledAt)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('INVALID_INPUT')
    })

    it('should return error when scheduledAt is missing', async () => {
      const result = await scheduleTask('1', null as unknown as Date)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('MISSING_REQUIRED_FIELD')
    })

    it('should return error when repository throws', async () => {
      const scheduledAt = new Date('2026-01-31T14:00:00')
      vi.mocked(scheduleTaskInDB).mockRejectedValue(new Error('DB Error'))

      const result = await scheduleTask('1', scheduledAt)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
