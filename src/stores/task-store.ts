"use client";

import type { CSSProperties } from "react";
import { createElement } from "react";
import { create } from "zustand";
import { Task, Category, TaskStatus } from "@/types/task";
import {
  getTasks,
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  updateTaskStatus as updateTaskStatusAction,
} from "@/actions/tasks";
import { toast } from "sonner";
import { UndoToast } from "@/components/ui/undo-toast";

// タスクの同期状態
export type SyncStatus = "synced" | "pending" | "conflict";

// メタデータ付きタスク型
export interface TaskWithMeta extends Task {
  _syncStatus: SyncStatus;
  _localTimestamp: number;
  _pendingChanges?: Partial<Omit<Task, "category">> & { category?: Category };
}

// タスク作成用データ型
export interface CreateTaskData {
  title: string;
  category: string;
  deadline?: Date | null;
  scheduledDate?: string | null;
  scheduledAt?: Date | null;
  durationMinutes?: number | null;
}

// タスク更新用データ型
export interface UpdateTaskData {
  title?: string;
  category?: Category;
  deadline?: Date | null;
  scheduledDate?: string | null;
  scheduledAt?: Date | null;
  durationMinutes?: number | null;
}

const UNDO_TIMEOUT_MS = 5000;
const UNDO_TOAST_ID = "undo-toast";

type UndoOperation = "update" | "complete";

// Undo状態の型定義
interface UndoState {
  taskId: string;
  operation: UndoOperation;
  previousTask: TaskWithMeta;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface TaskState {
  // State
  tasks: TaskWithMeta[];
  isLoading: boolean;
  error: string | null;
  lastServerSync: number | null;
  undoState: UndoState | null; // Undo用状態（単一タスクのみ）

  // Actions - Initialization
  initializeTasks: (tasks: Task[]) => void;

  // Actions - Fetch
  fetchTasks: (userId: string, force?: boolean) => Promise<void>;

  // Actions - Create
  createTask: (userId: string, data: CreateTaskData) => Promise<Task | null>;

  // Actions - Update
  updateTask: (taskId: string, data: UpdateTaskData) => Promise<Task | null>;

  // Actions - Complete
  completeTask: (taskId: string) => Promise<void>;

  // Actions - Delete (soft delete by status change)
  archiveTask: (taskId: string) => Promise<void>;

  // Actions - Undo
  undo: () => Promise<void>;
  clearUndo: () => void;

  // Actions - Clear
  clearError: () => void;

  // Future: Offline support
  queueOfflineChange: (taskId: string, changes: Partial<Task>) => void;
  resolveConflict: (
    taskId: string,
    resolution: "local" | "server" | "merge"
  ) => void;
}

// タイムスタンプ比較による競合解決（Last-Write-Wins）
function resolveConflict(
  localTask: TaskWithMeta,
  serverTask: Task
): TaskWithMeta {
  const localTime = new Date(localTask.updatedAt).getTime();
  const serverTime = new Date(serverTask.updatedAt).getTime();

  // 1秒以内の差は同時刻とみなし、サーバーデータを優先
  if (Math.abs(localTime - serverTime) < 1000) {
    return {
      ...serverTask,
      _syncStatus: "synced",
      _localTimestamp: Date.now(),
    };
  }

  // Last-Write-Wins: 新しい方を採用
  if (localTime > serverTime && localTask._syncStatus === "pending") {
    // ローカルの方が新しく、まだ同期されていない場合
    return localTask;
  }

  return {
    ...serverTask,
    _syncStatus: "synced",
    _localTimestamp: Date.now(),
  };
}

function getUndoMessage(operation: UndoOperation, title: string): string {
  if (operation === "complete") {
    return `完了しました：${title}`;
  }
  return `更新しました：${title}`;
}

function getUndoProgressClass(operation: UndoOperation): string {
  return operation === "complete" ? "bg-emerald-500/70" : "bg-blue-500/70";
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  lastServerSync: null,
  undoState: null,

  // 初期化
  initializeTasks: (tasks: Task[]) => {
    const now = Date.now();
    set({
      tasks: tasks.map((task) => ({
        ...task,
        _syncStatus: "synced",
        _localTimestamp: now,
      })),
      lastServerSync: now,
      error: null,
    });
  },

  // タスク取得
  fetchTasks: async (userId: string, force: boolean = false) => {
    // キャッシュ戦略: 5分以内はスキップ（force=trueで強制再取得）
    const lastSync = get().lastServerSync;
    if (!force && lastSync && Date.now() - lastSync < 5 * 60 * 1000) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // 全ステータスのタスクを取得
      const result = await getTasks(userId, [
        "inbox",
        "scheduled",
        "done",
        "archived",
      ]);

      if (result.success && result.data) {
        const serverTasks = result.data;
        const localTasks = get().tasks;

        // 競合解決: サーバーとローカルをマージ
        const mergedTasks: TaskWithMeta[] = serverTasks.map((serverTask) => {
          const localTask = localTasks.find((t) => t.id === serverTask.id);

          if (!localTask) {
            // 新規タスク
            return {
              ...serverTask,
              _syncStatus: "synced",
              _localTimestamp: Date.now(),
            };
          }

          // 競合解決
          return resolveConflict(localTask, serverTask);
        });

        // ローカルのみにあるpendingタスクを保持
        const pendingLocalTasks = localTasks.filter(
          (t) =>
            t._syncStatus === "pending" &&
            !serverTasks.find((st) => st.id === t.id)
        );

        set({
          tasks: [...mergedTasks, ...pendingLocalTasks],
          lastServerSync: Date.now(),
          isLoading: false,
        });
      } else {
        set({
          error: result.error?.userMessage || "タスク取得に失敗しました",
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("[fetchTasks] Error:", error);
      set({
        error: "予期せぬエラーが発生しました",
        isLoading: false,
      });
      toast.error("タスク取得に失敗しました");
    }
  },

  // タスク作成（楽観的更新）
  createTask: async (
    userId: string,
    data: CreateTaskData
  ): Promise<Task | null> => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // 楽観的タスク作成
    const optimisticTask: TaskWithMeta = {
      id: tempId,
      userId,
      title: data.title,
      category: data.category as Category,
      deadline: data.deadline || null,
      scheduledDate: data.scheduledDate || null,
      scheduledAt: data.scheduledAt || null,
      durationMinutes: data.durationMinutes || null,
      status: data.scheduledAt || data.scheduledDate ? "scheduled" : "inbox",
      completedAt: null,
      rawInput: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _syncStatus: "pending",
      _localTimestamp: now,
    };

    // 楽観的更新
    set((state) => ({
      tasks: [optimisticTask, ...state.tasks],
    }));

    try {
      const result = await createTaskAction(userId, {
        title: data.title,
        category: data.category,
        deadline: data.deadline || undefined,
        scheduledDate: data.scheduledDate,
        scheduledAt: data.scheduledAt || undefined,
        durationMinutes: data.durationMinutes || undefined,
      });

      if (result.success && result.data) {
        // 成功: 実データで置き換え
        const actualTask: TaskWithMeta = {
          ...result.data,
          _syncStatus: "synced",
          _localTimestamp: now,
        };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === tempId ? actualTask : t)),
        }));

        toast.success("タスクを作成しました");
        return result.data;
      } else {
        throw new Error(result.error?.userMessage || "タスク作成に失敗しました");
      }
    } catch (error) {
      console.error("[createTask] Error:", error);

      // 失敗: conflict状態に変更
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === tempId ? { ...t, _syncStatus: "conflict" } : t
        ),
      }));

      toast.error(
        error instanceof Error ? error.message : "タスク作成に失敗しました"
      );
      return null;
    }
  },

  // タスク更新（楽観的更新）
  updateTask: async (
    taskId: string,
    data: UpdateTaskData
  ): Promise<Task | null> => {
    const now = Date.now();
    const currentTask = get().tasks.find((t) => t.id === taskId);

    if (!currentTask) {
      toast.error("タスクが見つかりません");
      return null;
    }

    // 既存のUndo状態をクリア
    const existingUndo = get().undoState;
    if (existingUndo) {
      clearTimeout(existingUndo.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      get().clearUndo();
    }, UNDO_TIMEOUT_MS);

    set({
      undoState: {
        taskId,
        operation: "update",
        previousTask: currentTask,
        timeoutId,
      },
    });

    // 楽観的更新
      const optimisticTask: TaskWithMeta = {
        ...currentTask,
        ...(data.title && { title: data.title }),
        ...(data.category && { category: data.category }),
        ...(data.deadline !== undefined && { deadline: data.deadline }),
      ...(data.scheduledDate !== undefined && { scheduledDate: data.scheduledDate }),
      ...(data.scheduledAt !== undefined && {
        scheduledAt: data.scheduledAt,
      }),
      ...(data.scheduledDate !== undefined || data.scheduledAt !== undefined
        ? {
            status:
              (data.scheduledAt ?? currentTask.scheduledAt) ||
              (data.scheduledDate ?? currentTask.scheduledDate)
                ? ("scheduled" as TaskStatus)
                : ("inbox" as TaskStatus),
          }
        : {}),
      ...(data.durationMinutes !== undefined && {
        durationMinutes: data.durationMinutes,
      }),
      updatedAt: new Date(),
      _syncStatus: "pending",
      _localTimestamp: now,
      _pendingChanges: {
        ...data,
        category: data.category,
      },
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? optimisticTask : t)),
    }));

    try {
      const result = await updateTaskAction(taskId, {
        title: data.title,
        category: data.category,
        deadline: data.deadline,
        scheduledDate: data.scheduledDate,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
      });

      if (result.success && result.data) {
        // 成功: 実データで置き換え
        const actualTask: TaskWithMeta = {
          ...result.data,
          _syncStatus: "synced",
          _localTimestamp: now,
        };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? actualTask : t)),
        }));

        const progressStyle: CSSProperties = {
          animationDuration: `${UNDO_TIMEOUT_MS}ms`,
        };

        toast.custom(
          (t) =>
            createElement(UndoToast, {
              message: getUndoMessage("update", actualTask.title),
              variant: "update",
              progressClassName: getUndoProgressClass("update"),
              progressStyle,
              onUndo: () => {
                toast.dismiss(t);
                get().undo();
              },
            }),
          { id: UNDO_TOAST_ID, duration: UNDO_TIMEOUT_MS }
        );
        return result.data;
      } else {
        throw new Error(result.error?.userMessage || "タスク更新に失敗しました");
      }
    } catch (error) {
      console.error("[updateTask] Error:", error);

      // 失敗: 元の状態に戻す
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? currentTask : t
        ),
        undoState: null,
      }));

      toast.error(
        error instanceof Error ? error.message : "タスク更新に失敗しました"
      );
      return null;
    }
  },

  // タスク完了
  completeTask: async (taskId: string): Promise<void> => {
    const now = Date.now();
    const currentTask = get().tasks.find((t) => t.id === taskId);

    if (!currentTask) {
      toast.error("タスクが見つかりません");
      return;
    }

    // 既存のUndo状態をクリア
    const existingUndo = get().undoState;
    if (existingUndo) {
      clearTimeout(existingUndo.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      get().clearUndo();
    }, UNDO_TIMEOUT_MS);

    set({
      undoState: {
        taskId,
        operation: "complete",
        previousTask: currentTask,
        timeoutId,
      },
    });

    // 楽観的更新
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "done" as TaskStatus,
              completedAt: new Date(),
              updatedAt: new Date(),
              _syncStatus: "pending",
              _localTimestamp: now,
            }
          : t
      ),
    }));

    try {
      const result = await updateTaskStatusAction(taskId, "done");

      if (result.success) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, _syncStatus: "synced", _localTimestamp: now }
              : t
          ),
        }));
        const progressStyle: CSSProperties = {
          animationDuration: `${UNDO_TIMEOUT_MS}ms`,
        };

        toast.custom(
          (t) =>
            createElement(UndoToast, {
              message: getUndoMessage("complete", currentTask.title),
              variant: "complete",
              progressClassName: getUndoProgressClass("complete"),
              progressStyle,
              onUndo: () => {
                toast.dismiss(t);
                get().undo();
              },
            }),
          { id: UNDO_TOAST_ID, duration: UNDO_TIMEOUT_MS }
        );
      } else {
        throw new Error("タスク完了に失敗しました");
      }
    } catch (error) {
      console.error("[completeTask] Error:", error);

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? currentTask : t
        ),
        undoState: null,
      }));

      toast.error("タスク完了に失敗しました");
    }
  },

  // タスクアーカイブ
  archiveTask: async (taskId: string): Promise<void> => {
    const now = Date.now();

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "archived" as TaskStatus,
              updatedAt: new Date(),
              _syncStatus: "pending",
              _localTimestamp: now,
            }
          : t
      ),
    }));

    try {
      const result = await updateTaskStatusAction(taskId, "archived");

      if (result.success) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
        toast.success("タスクをアーカイブしました");
      } else {
        throw new Error("タスクのアーカイブに失敗しました");
      }
    } catch (error) {
      console.error("[archiveTask] Error:", error);

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, _syncStatus: "conflict" } : t
        ),
      }));

      toast.error("タスクのアーカイブに失敗しました");
    }
  },

  // Undo: 直前のタスク状態に戻す
  undo: async (): Promise<void> => {
    const currentUndo = get().undoState;
    if (!currentUndo) return;

    const { taskId, previousTask, operation } = currentUndo;
    clearTimeout(currentUndo.timeoutId);

    // まずはローカル状態を即座に復元
    set((state) => {
      const hasTask = state.tasks.some((t) => t.id === taskId);
      const restoredTasks = hasTask
        ? state.tasks.map((t) => (t.id === taskId ? previousTask : t))
        : [previousTask, ...state.tasks];

      return {
        tasks: restoredTasks,
        undoState: null,
      };
    });

    if (operation === "update") {
      try {
        const result = await updateTaskAction(taskId, {
          title: previousTask.title,
          category: previousTask.category,
          deadline: previousTask.deadline,
          scheduledAt: previousTask.scheduledAt,
          durationMinutes: previousTask.durationMinutes,
        });

        if (result.success && result.data) {
          const actualTask: TaskWithMeta = {
            ...result.data,
            _syncStatus: "synced",
            _localTimestamp: Date.now(),
          };
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? actualTask : t
            ),
          }));
        } else {
          throw new Error(result.error?.userMessage || "元に戻せませんでした");
        }
      } catch (error) {
        console.error("[undo:update] Error:", error);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, _syncStatus: "conflict" } : t
          ),
        }));
        toast.error("元に戻せませんでした");
      }
    }

    if (operation === "complete") {
      try {
        const result = await updateTaskStatusAction(
          taskId,
          previousTask.status
        );

        if (result.success && result.data) {
          const actualTask: TaskWithMeta = {
            ...result.data,
            _syncStatus: "synced",
            _localTimestamp: Date.now(),
          };
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? actualTask : t
            ),
          }));
        } else {
          throw new Error(result.error?.userMessage || "元に戻せませんでした");
        }
      } catch (error) {
        console.error("[undo:complete] Error:", error);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, _syncStatus: "conflict" } : t
          ),
        }));
        toast.error("元に戻せませんでした");
      }
    }
  },

  // Undo状態をクリア
  clearUndo: () => {
    const currentUndo = get().undoState;
    if (currentUndo) {
      clearTimeout(currentUndo.timeoutId);
    }
    set({ undoState: null });
  },

  // エラークリア
  clearError: () => set({ error: null }),

  // Future: Offline support (placeholder)
  queueOfflineChange: () => {
    // TODO(Phase C): オフライン時の変更をキューに追加
    console.log("[queueOfflineChange] Not implemented yet");
  },

  resolveConflict: () => {
    // TODO(Phase C): 競合解決UI
    console.log("[resolveConflict] Not implemented yet");
  },
}));

// Selector helpers
export const selectActiveTasks = (state: TaskState) =>
  state.tasks.filter((t) => t.status === "inbox" || t.status === "scheduled");

export const selectScheduledTasks = (state: TaskState) =>
  state.tasks.filter(
    (t) =>
      (t.status === "scheduled" || t.status === "done") &&
      (t.scheduledAt || t.scheduledDate)
  );

export const selectCompletedTasks = (state: TaskState) =>
  state.tasks.filter((t) => t.status === "done");

export const selectInboxTasks = (state: TaskState) =>
  state.tasks.filter((t) => t.status === "inbox");
