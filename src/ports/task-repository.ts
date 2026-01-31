import { Task } from "@/types/task";

/**
 * Task Repository Port (Interface)
 * データアクセスの抽象化レイヤー
 */
export interface TaskRepository {
  /**
   * タスクを作成
   */
  create(userId: string, data: {
    title: string;
    category: string;
    deadline?: Date;
    scheduledAt?: Date;
    durationMinutes?: number;
    rawInput?: string;
  }): Promise<Task>;

  /**
   * ユーザーのタスク一覧を取得
   */
  getTasks(userId: string, status?: string[]): Promise<Task[]>;

  /**
   * タスクのステータスを更新
   */
  updateStatus(taskId: string, status: string): Promise<Task>;

  /**
   * タスクをスケジュール
   */
  schedule(taskId: string, scheduledAt: Date): Promise<Task>;
}
