import { Task, Category, TaskStatus } from "@/types/task";

/**
 * Prismaから返ってくる生データを正しい型に変換
 */
export function mapPrismaTaskToTask(prismaTask: {
  id: string;
  userId: string;
  title: string;
  category: string;
  deadline: Date | null;
  scheduledDate: string | null;
  scheduledAt: Date | null;
  durationMinutes: number | null;
  status: string;
  completedAt: Date | null;
  rawInput: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Task {
  // Category型に変換
  const validCategories: Category[] = ["shopping", "reply", "work", "personal", "other"];
  const category = validCategories.includes(prismaTask.category as Category) 
    ? (prismaTask.category as Category) 
    : "other";

  // TaskStatus型に変換
  const validStatuses: TaskStatus[] = ["inbox", "scheduled", "done", "archived"];
  const status = validStatuses.includes(prismaTask.status as TaskStatus)
    ? (prismaTask.status as TaskStatus)
    : "inbox";

  return {
    ...prismaTask,
    category,
    status,
  };
}

/**
 * Prismaタスク配列を変換
 */
export function mapPrismaTasksToTasks(prismaTasks: Array<{
  id: string;
  userId: string;
  title: string;
  category: string;
  deadline: Date | null;
  scheduledDate: string | null;
  scheduledAt: Date | null;
  durationMinutes: number | null;
  status: string;
  completedAt: Date | null;
  rawInput: string | null;
  createdAt: Date;
  updatedAt: Date;
}>): Task[] {
  return prismaTasks.map(mapPrismaTaskToTask);
}
