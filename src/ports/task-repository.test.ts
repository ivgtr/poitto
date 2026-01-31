import { describe, it, expect, vi } from 'vitest'
import type { Task } from '@/types/task'
import type { TaskRepository } from '@/ports/task-repository'

// モック用のインメモリリポジトリ関数
function createInMemoryRepository(): TaskRepository {
  const tasks = new Map<string, Task>()
  let idCounter = 1

  return {
    async create(userId: string, data: {
      title: string
      category: string
      deadline?: Date
      scheduledAt?: Date
      durationMinutes?: number
      rawInput?: string
    }): Promise<Task> {
      const trimmedTitle = data.title.trim()
      if (!trimmedTitle) {
        throw new Error('タスクのタイトルが必要です')
      }

      const task: Task = {
        id: `task-${idCounter++}`,
        userId,
        title: trimmedTitle,
        category: data.category,
        deadline: data.deadline || null,
        scheduledAt: data.scheduledAt || null,
        durationMinutes: data.durationMinutes || null,
        status: data.scheduledAt ? 'scheduled' : 'inbox',
        rawInput: data.rawInput || trimmedTitle,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      }

      tasks.set(task.id, task)
      return task
    },

    async getTasks(userId: string, status?: string[]): Promise<Task[]> {
      const allTasks = Array.from(tasks.values())
      return allTasks.filter(
        (task) =>
          task.userId === userId &&
          (!status || status.includes(task.status))
      )
    },

    async updateStatus(taskId: string, status: string): Promise<Task> {
      const task = tasks.get(taskId)
      if (!task) {
        throw new Error('タスクが見つかりません')
      }

      const updated: Task = {
        ...task,
        status,
        completedAt: status === 'done' ? new Date() : null,
        updatedAt: new Date(),
      }

      tasks.set(taskId, updated)
      return updated
    },

    async schedule(taskId: string, scheduledAt: Date): Promise<Task> {
      const task = tasks.get(taskId)
      if (!task) {
        throw new Error('タスクが見つかりません')
      }

      const updated: Task = {
        ...task,
        scheduledAt,
        status: 'scheduled',
        updatedAt: new Date(),
      }

      tasks.set(taskId, updated)
      return updated
    },
  }
}

describe('TaskRepository Interface', () => {
  let repository: TaskRepository

  beforeEach(() => {
    repository = createInMemoryRepository()
  })

  describe('create', () => {
    it('should create a task with valid data', async () => {
      const task = await repository.create('user-1', {
        title: '新宿で山田とごはん',
        category: 'personal',
      })

      expect(task.title).toBe('新宿で山田とごはん')
      expect(task.category).toBe('personal')
      expect(task.status).toBe('inbox')
      expect(task.userId).toBe('user-1')
    })

    it('should create scheduled task when scheduledAt is provided', async () => {
      const scheduledAt = new Date('2026-01-31T15:00:00+09:00')
      const task = await repository.create('user-1', {
        title: 'お茶を買う',
        category: 'shopping',
        scheduledAt,
      })

      expect(task.status).toBe('scheduled')
      expect(task.scheduledAt).toEqual(scheduledAt)
    })

    it('should throw error when title is empty', async () => {
      await expect(
        repository.create('user-1', { title: '', category: 'personal' })
      ).rejects.toThrow('タスクのタイトルが必要です')
    })

    it('should throw error when title is whitespace only', async () => {
      await expect(
        repository.create('user-1', { title: '   ', category: 'personal' })
      ).rejects.toThrow('タスクのタイトルが必要です')
    })

    it('should trim title whitespace', async () => {
      const task = await repository.create('user-1', {
        title: '  お茶を買う  ',
        category: 'shopping',
      })

      expect(task.title).toBe('お茶を買う')
    })
  })

  describe('getTasks', () => {
    it('should return tasks for specific user', async () => {
      await repository.create('user-1', { title: 'タスク1', category: 'work' })
      await repository.create('user-2', { title: 'タスク2', category: 'personal' })

      const tasks = await repository.getTasks('user-1')

      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('タスク1')
    })

    it('should filter by status', async () => {
      const scheduledAt = new Date()
      await repository.create('user-1', { title: 'タスク1', category: 'work' })
      await repository.create('user-1', {
        title: 'タスク2',
        category: 'personal',
        scheduledAt,
      })

      const inboxTasks = await repository.getTasks('user-1', ['inbox'])
      const scheduledTasks = await repository.getTasks('user-1', ['scheduled'])

      expect(inboxTasks).toHaveLength(1)
      expect(inboxTasks[0].title).toBe('タスク1')
      expect(scheduledTasks).toHaveLength(1)
      expect(scheduledTasks[0].title).toBe('タスク2')
    })
  })

  describe('updateStatus', () => {
    it('should update task status to done', async () => {
      const task = await repository.create('user-1', {
        title: 'タスク',
        category: 'work',
      })

      const updated = await repository.updateStatus(task.id, 'done')

      expect(updated.status).toBe('done')
      expect(updated.completedAt).toBeInstanceOf(Date)
    })

    it('should clear completedAt when status is not done', async () => {
      const task = await repository.create('user-1', {
        title: 'タスク',
        category: 'work',
      })

      await repository.updateStatus(task.id, 'done')
      const updated = await repository.updateStatus(task.id, 'inbox')

      expect(updated.status).toBe('inbox')
      expect(updated.completedAt).toBeNull()
    })
  })

  describe('schedule', () => {
    it('should schedule a task', async () => {
      const task = await repository.create('user-1', {
        title: 'タスク',
        category: 'work',
      })
      const scheduledAt = new Date('2026-02-01T10:00:00+09:00')

      const updated = await repository.schedule(task.id, scheduledAt)

      expect(updated.status).toBe('scheduled')
      expect(updated.scheduledAt).toEqual(scheduledAt)
    })
  })
})

describe('TaskRepository with different implementations', () => {
  it('should work with any implementation', async () => {
    // テスト用のモック実装
    const mockRepository: TaskRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'mock-task',
        title: 'テスト',
        category: 'personal',
      } as Task),
      getTasks: vi.fn().mockResolvedValue([]),
      updateStatus: vi.fn().mockResolvedValue({} as Task),
      schedule: vi.fn().mockResolvedValue({} as Task),
    }

    await mockRepository.create('user-1', { title: 'テスト', category: 'work' })
    expect(mockRepository.create).toHaveBeenCalledWith('user-1', {
      title: 'テスト',
      category: 'work',
    })
  })
})
