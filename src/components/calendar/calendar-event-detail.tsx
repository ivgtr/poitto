"use client";

import { Calendar, Clock, Tag, Trash2, X } from "lucide-react";
import { TaskEditDialog } from "@/components/task-edit";
import { Button } from "@/components/ui/button";
import { formatTimeRange } from "@/components/calendar/calendar-utils";
import { categoryConfig, formatDuration } from "@/lib/task-utils";
import { Task } from "@/types/task";

interface CalendarEventDetailProps {
  task: Task;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
  onComplete: () => void;
  showComplete: boolean;
}

export function CalendarEventDetail({
  task,
  onUpdate,
  onDelete,
  onClose,
  onComplete,
  showComplete,
}: CalendarEventDetailProps) {
  const config = categoryConfig[task.category];
  const scheduledAt = task.scheduledAt ? new Date(task.scheduledAt) : null;
  const dateLabel = scheduledAt
    ? scheduledAt.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      })
    : "日付未定";
  const timeLabel = scheduledAt
    ? task.durationMinutes
      ? formatTimeRange(scheduledAt, task.durationMinutes)
      : scheduledAt.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })
    : "";
  const scheduleLabel = scheduledAt && timeLabel ? `${dateLabel}・${timeLabel}` : dateLabel;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-3 w-3 rounded-full ${config.bgColor}`} />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-900 break-words">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600">{scheduleLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onUpdate && (
            <TaskEditDialog
              task={task}
              onSave={onUpdate}
              buttonClassName="h-7 w-7 bg-gray-100 hover:bg-gray-200"
              iconClassName="h-3.5 w-3.5"
            />
          )}
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
            title="削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
            title="閉じる"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{scheduleLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className={config.color}>{config.label}</span>
        </div>
        {task.durationMinutes && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{formatDuration(task.durationMinutes)}</span>
          </div>
        )}
        {task.deadline && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              期限: {new Date(task.deadline).toLocaleDateString("ja-JP")}
            </span>
          </div>
        )}
      </div>

      {showComplete && (
        <Button className="w-full" onClick={onComplete}>
          完了
        </Button>
      )}
    </div>
  );
}
