import { Task } from "@/types/task";
import { createTask, updateTaskStatus } from "@/actions/tasks";
import { TaskInfo } from "@/domain/task/task-fields";

export interface TaskService {
  create(taskInfo: TaskInfo, userId: string): Promise<Task>;
  complete(taskId: string): Promise<void>;
}

export const taskService: TaskService = {
  async create(taskInfo: TaskInfo, userId: string): Promise<Task> {
    return await createTask(userId, {
      title: taskInfo.title!,
      category: taskInfo.category || "other",
      deadline: taskInfo.deadline ? new Date(taskInfo.deadline) : undefined,
      scheduledAt: taskInfo.scheduledAt ? new Date(taskInfo.scheduledAt) : undefined,
      durationMinutes: taskInfo.durationMinutes || undefined,
    });
  },

  async complete(taskId: string): Promise<void> {
    await updateTaskStatus(taskId, "done");
  },
};
