import { Task } from "@/types/task";

/**
 * ステータスベースの抽象判定
 * 未完了でアクション可能なタスク（inbox + scheduled）
 */
export function isActive(task: Task): boolean {
  return task.status === "inbox" || task.status === "scheduled";
}

/**
 * 完了済みタスク
 */
export function isCompleted(task: Task): boolean {
  return task.status === "done";
}

/**
 * アーカイブ済みタスク
 */
export function isArchived(task: Task): boolean {
  return task.status === "archived";
}

/**
 * 属性ベースの抽象判定
 * 予定（scheduledAt）が設定されているタスク
 */
export function isScheduled(task: Task): boolean {
  return task.scheduledAt !== null;
}

/**
 * 予定が設定されていないタスク
 */
export function isUnscheduled(task: Task): boolean {
  return task.scheduledAt === null;
}

/**
 * 用途別取得関数
 */

/**
 * Kanban（タスク管理）用：未完了タスクを取得
 */
export function getActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter(isActive);
}

/**
 * Doneページ用：完了タスクを取得
 */
export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter(isCompleted);
}

/**
 * Calendar（予定管理）用：予定ありタスクを取得
 */
export function getScheduledTasks(tasks: Task[]): Task[] {
  return tasks.filter(isScheduled);
}

/**
 * アーカイブ済みタスクを取得
 */
export function getArchivedTasks(tasks: Task[]): Task[] {
  return tasks.filter(isArchived);
}
