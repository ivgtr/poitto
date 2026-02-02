import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Task } from "@/types/task";
import { mapPrismaTasksToTasks, mapPrismaTaskToTask } from "@/lib/task-mapper";

/**
 * Prisma Task Repository - Data Access Layer
 * 純粋なデータアクセスのみ担当（キャッシュ制御はServer Actions側で）
 */

export async function createTaskInDB(userId: string, data: {
  title: string;
  category: string;
  deadline?: Date;
  scheduledAt?: Date;
  durationMinutes?: number;
  rawInput?: string;
}): Promise<Task> {
  // タイトルのバリデーション
  const title = data.title?.trim();
  if (!title) {
    throw new Error("タスクのタイトルが必要です");
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      category: data.category || "other",
      deadline: data.deadline || null,
      scheduledAt: data.scheduledAt || null,
      durationMinutes: data.durationMinutes || null,
      status: data.scheduledAt ? "scheduled" : "inbox",
      rawInput: data.rawInput || title,
    },
  });

  return mapPrismaTaskToTask(task);
}

export async function getTasksFromDB(userId: string, status?: string[]): Promise<Task[]> {
  if (status && status.length === 0) {
    return [];
  }
  const whereStatus = status?.length
    ? { in: status }
    : { in: ["inbox", "scheduled"] };

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: whereStatus,
    },
    orderBy: [
      { status: "asc" },
      { scheduledAt: "asc" },
    ],
  });

  return mapPrismaTasksToTasks(tasks);
}

export async function updateTaskStatusInDB(taskId: string, status: string): Promise<Task> {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "done" ? new Date() : null,
    },
  });

  return mapPrismaTaskToTask(task);
}

export async function scheduleTaskInDB(taskId: string, scheduledAt: Date): Promise<Task> {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      scheduledAt,
      status: "scheduled",
    },
  });

  return mapPrismaTaskToTask(task);
}

export async function updateTaskInDB(
  taskId: string,
  data: {
    title?: string;
    category?: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }
): Promise<Task> {
  const updateData: Prisma.TaskUpdateInput = {};

  if (data.title !== undefined) {
    const trimmedTitle = data.title.trim();
    if (!trimmedTitle) {
      throw new Error("タスクのタイトルが必要です");
    }
    updateData.title = trimmedTitle;
  }

  if (data.category !== undefined) {
    updateData.category = data.category;
  }

  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline;
  }

  if (data.scheduledAt !== undefined) {
    updateData.scheduledAt = data.scheduledAt;
    // scheduledAtが設定された場合、ステータスを更新
    if (data.scheduledAt) {
      updateData.status = "scheduled";
    }
  }

  if (data.durationMinutes !== undefined) {
    updateData.durationMinutes = data.durationMinutes;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  return mapPrismaTaskToTask(task);
}
