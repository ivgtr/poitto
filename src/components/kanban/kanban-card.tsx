"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { TaskEditDialog } from "@/components/task-edit";
import { categoryConfig, formatDuration } from "@/lib/task-utils";
import { Task } from "@/types/task";

interface KanbanCardProps {
  task: Task;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
  onComplete?: (taskId: string) => Promise<void>;
}

export function KanbanCard({ task, onUpdate, onComplete }: KanbanCardProps) {
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
  const [isCompleting, setIsCompleting] = useState(false);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
  }, []);

  const handleComplete = useCallback(async () => {
    if (!onComplete || isCompleting) return;
    setIsCompleting(true);

    completeTimeoutRef.current = setTimeout(async () => {
      await onComplete(task.id);
      if (isMountedRef.current) {
        setIsCompleting(false);
      }
    }, 220);
  }, [onComplete, task.id, isCompleting]);

  const cardContent = (
    <div
      className={`relative max-h-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 ease-out hover:shadow-md ${
        isCompleting ? "opacity-0 translate-y-1 scale-[0.98]" : ""
      }`}
      role={onUpdate ? "button" : undefined}
      tabIndex={onUpdate ? 0 : undefined}
    >
      <div className="flex items-start gap-2">
        {onComplete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleComplete();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-7 w-7 md:h-6 md:w-6 items-center justify-center rounded-full border border-gray-300 bg-transparent transition-colors hover:bg-gray-50"
            title="完了"
            aria-label="タスクを完了"
          >
            <Check className="h-3.5 w-3.5 md:h-3 md:w-3 text-gray-500" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] md:text-sm leading-7 md:leading-6 font-semibold text-gray-900 whitespace-normal break-words">
            {task.title}
          </p>
          <div className="mt-2 space-y-1 text-[13px] md:text-xs text-gray-600">
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
      </div>
    </div>
  );

  if (!onUpdate) {
    return cardContent;
  }

  return (
    <TaskEditDialog
      task={task}
      onSave={onUpdate}
      trigger={cardContent}
    />
  );
}
