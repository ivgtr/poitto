"use server";

import { revalidatePath } from "next/cache";
import { Task } from "@/types/task";
import {
  createTaskInDB,
  getTasksFromDB,
  updateTaskStatusInDB,
  scheduleTaskInDB,
} from "@/infrastructure/persistence/prisma-task-repository";

/**
 * Server Actions - Repository関数のラッパー
 * データアクセス + キャッシュ制御を担当
 */

export async function getTasks(userId: string): Promise<Task[]> {
  return getTasksFromDB(userId);
}

export async function createTask(userId: string, data: {
  title: string;
  category: string;
  deadline?: Date;
  scheduledAt?: Date;
  durationMinutes?: number;
}): Promise<Task> {
  const task = await createTaskInDB(userId, data);
  revalidatePath("/");
  return task;
}

export async function updateTaskStatus(taskId: string, status: string): Promise<Task> {
  const task = await updateTaskStatusInDB(taskId, status);
  revalidatePath("/");
  return task;
}

export async function scheduleTask(taskId: string, scheduledAt: Date): Promise<Task> {
  const task = await scheduleTaskInDB(taskId, scheduledAt);
  revalidatePath("/");
  return task;
}
