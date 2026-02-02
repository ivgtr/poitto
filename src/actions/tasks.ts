"use server";

import { revalidatePath } from "next/cache";
import { Task } from "@/types/task";
import {
  createError,
  handleError,
  ActionResult,
  success,
  failure,
  ErrorCode,
} from "@/lib/errors";
import {
  createTaskInDB,
  getTasksFromDB,
  updateTaskStatusInDB,
  scheduleTaskInDB,
  updateTaskInDB,
} from "@/infrastructure/persistence/prisma-task-repository";

/**
 * Server Actions - Repository関数のラッパー
 * データアクセス + キャッシュ制御 + 統一エラーハンドリング
 */

type TaskStatusValue = "inbox" | "scheduled" | "done" | "archived";
const VALID_TASK_STATUS_SET = new Set<string>([
  "inbox",
  "scheduled",
  "done",
  "archived",
]);

function isValidStatus(value: string): value is TaskStatusValue {
  return VALID_TASK_STATUS_SET.has(value);
}

export async function getTasks(
  userId: string,
  status: string[]
): Promise<ActionResult<Task[]>> {
  try {
    if (!userId) {
      return failure(createError(ErrorCode.UNAUTHORIZED, "User ID is required"));
    }

    const filteredStatuses = status.filter(isValidStatus);

    if (filteredStatuses.length === 0) {
      return success([]);
    }

    const tasks = await getTasksFromDB(userId, filteredStatuses);
    return success(tasks);
  } catch (error) {
    console.error("[getTasks] Error:", error);
    return failure(handleError(error));
  }
}

export async function createTask(
  userId: string,
  data: {
    title: string;
    category: string;
    deadline?: Date;
    scheduledAt?: Date;
    durationMinutes?: number;
  }
): Promise<ActionResult<Task>> {
  try {
    if (!userId) {
      return failure(createError(ErrorCode.UNAUTHORIZED, "User ID is required"));
    }

    if (!data.title?.trim()) {
      return failure(
        createError(ErrorCode.MISSING_REQUIRED_FIELD, "Title is required")
      );
    }

    const task = await createTaskInDB(userId, data);
    revalidatePath("/");
    return success(task);
  } catch (error) {
    console.error("[createTask] Error:", error);
    return failure(handleError(error));
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<ActionResult<Task>> {
  try {
    if (!taskId) {
      return failure(
        createError(ErrorCode.INVALID_INPUT, "Task ID is required")
      );
    }

    const task = await updateTaskStatusInDB(taskId, status);
    revalidatePath("/");
    return success(task);
  } catch (error) {
    console.error("[updateTaskStatus] Error:", error);
    return failure(handleError(error));
  }
}

export async function scheduleTask(
  taskId: string,
  scheduledAt: Date
): Promise<ActionResult<Task>> {
  try {
    if (!taskId) {
      return failure(
        createError(ErrorCode.INVALID_INPUT, "Task ID is required")
      );
    }

    if (!scheduledAt) {
      return failure(
        createError(ErrorCode.MISSING_REQUIRED_FIELD, "Schedule date is required")
      );
    }

    const task = await scheduleTaskInDB(taskId, scheduledAt);
    revalidatePath("/");
    return success(task);
  } catch (error) {
    console.error("[scheduleTask] Error:", error);
    return failure(handleError(error));
  }
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    category?: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }
): Promise<ActionResult<Task>> {
  try {
    if (!taskId) {
      return failure(
        createError(ErrorCode.INVALID_INPUT, "Task ID is required")
      );
    }

    if (data.title !== undefined && !data.title.trim()) {
      return failure(
        createError(ErrorCode.MISSING_REQUIRED_FIELD, "Title is required")
      );
    }

    const task = await updateTaskInDB(taskId, data);
    revalidatePath("/");
    return success(task);
  } catch (error) {
    console.error("[updateTask] Error:", error);
    return failure(handleError(error));
  }
}
