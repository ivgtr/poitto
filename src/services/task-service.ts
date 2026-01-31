"use client";

import { Task } from "@/types/task";
import { createTask, updateTaskStatus, updateTask } from "@/actions/tasks";
import { TaskInfo } from "@/domain/task/task-fields";
import { AppError } from "@/lib/errors";

export interface TaskService {
  create(taskInfo: TaskInfo, userId: string): Promise<Task>;
  complete(taskId: string): Promise<void>;
  update(taskId: string, data: {
    title?: string;
    category?: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }): Promise<Task>;
}

function handleActionResult<T>(result: { success: boolean; data?: T; error?: AppError }): T {
  if (!result.success) {
    throw new Error(result.error?.userMessage || "エラーが発生しました");
  }
  if (!result.data) {
    throw new Error("データが返されませんでした");
  }
  return result.data;
}

export const taskService: TaskService = {
  async create(taskInfo: TaskInfo, userId: string): Promise<Task> {
    const result = await createTask(userId, {
      title: taskInfo.title!,
      category: taskInfo.category || "other",
      deadline: taskInfo.deadline ? new Date(taskInfo.deadline) : undefined,
      scheduledAt: taskInfo.scheduledAt ? new Date(taskInfo.scheduledAt) : undefined,
      durationMinutes: taskInfo.durationMinutes || undefined,
    });
    
    return handleActionResult(result);
  },

  async complete(taskId: string): Promise<void> {
    const result = await updateTaskStatus(taskId, "done");
    handleActionResult(result);
  },

  async update(taskId: string, data: {
    title?: string;
    category?: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }): Promise<Task> {
    const result = await updateTask(taskId, data);
    return handleActionResult(result);
  },
};

export async function handleTaskUpdate(
  taskId: string,
  data: {
    title?: string;
    category?: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  },
  onUpdate: (taskId: string, task: Task) => void
): Promise<void> {
  try {
    const updatedTask = await taskService.update(taskId, data);
    onUpdate(taskId, updatedTask);
  } catch (error) {
    console.error("[handleTaskUpdate] Error:", error);
    throw error;
  }
}
