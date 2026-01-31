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

      const result = await getTasks('user-1')

      expect(result).toEqual(mockTasks)
      expect(getTasksFromDB).toHaveBeenCalledWith('user-1')
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

      expect(result).toEqual(mockTask)
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

      expect(result.status).toBe('scheduled')
      expect(createTaskInDB).toHaveBeenCalledWith('user-1', {
        title: '期限付きタスク',
        category: 'work',
        scheduledAt,
        deadline,
        durationMinutes: 60,
      })
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

      expect(result.status).toBe('done')
      expect(result.completedAt).toBeInstanceOf(Date)
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

      expect(result.status).toBe('inbox')
      expect(result.completedAt).toBeNull()
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

      expect(result.status).toBe('scheduled')
      expect(result.scheduledAt).toEqual(scheduledAt)
      expect(scheduleTaskInDB).toHaveBeenCalledWith('1', scheduledAt)
    })
  })
})
