import { prisma } from "@/lib/prisma";
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
