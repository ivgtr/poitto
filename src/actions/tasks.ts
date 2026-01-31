"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Task } from "@/types/task";
import { mapPrismaTasksToTasks, mapPrismaTaskToTask } from "@/lib/task-mapper";

export async function getTasks(userId: string): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: {
        in: ["inbox", "scheduled"],
      },
    },
    orderBy: [
      { status: "asc" },
      { scheduledAt: "asc" },
    ],
  });

  return mapPrismaTasksToTasks(tasks);
}

export async function createTask(userId: string, data: {
  title: string;
  category: string;
  deadline?: Date;
  scheduledAt?: Date;
  durationMinutes?: number;
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
      rawInput: title,
    },
  });

  revalidatePath("/");
  return mapPrismaTaskToTask(task);
}

export async function updateTaskStatus(taskId: string, status: string): Promise<Task> {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "done" ? new Date() : null,
    },
  });

  revalidatePath("/");
  return mapPrismaTaskToTask(task);
}

export async function scheduleTask(taskId: string, scheduledAt: Date): Promise<Task> {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      scheduledAt,
      status: "scheduled",
    },
  });

  revalidatePath("/");
  return mapPrismaTaskToTask(task);
}
