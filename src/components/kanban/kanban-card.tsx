"use client";

import { TaskEditDialog } from "@/components/task-edit";
import { categoryConfig, formatDuration } from "@/lib/task-utils";
import { Task } from "@/types/task";

interface KanbanCardProps {
  task: Task;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
}

export function KanbanCard({ task, onUpdate }: KanbanCardProps) {
  const config = categoryConfig[task.category];
  const deadlineLabel = task.deadline
    ? new Date(task.deadline).toLocaleDateString("ja-JP")
    : null;
  const scheduledLabel = task.scheduledAt
    ? new Date(task.scheduledAt).toLocaleString("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="relative max-h-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 ease-out hover:shadow-md">
      {onUpdate && (
        <div className="absolute right-2 top-2">
          <TaskEditDialog task={task} onSave={onUpdate} />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900 pr-7 whitespace-normal break-words">
        {task.title}
      </p>
      <div className="mt-2 space-y-1 text-xs text-gray-600">
        <p>
          カテゴリ: <span className={config.color}>{config.label}</span>
        </p>
        {deadlineLabel && <p>期限: {deadlineLabel}</p>}
        {scheduledLabel && <p>予定: {scheduledLabel}</p>}
        {task.durationMinutes && (
          <p>所要時間: {formatDuration(task.durationMinutes)}</p>
        )}
      </div>
    </div>
  );
}
