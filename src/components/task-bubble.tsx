"use client";

import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { categoryConfig, formatDuration, getBubbleSize } from "@/lib/task-utils";
import { Check } from "lucide-react";
import { TaskEditDialog } from "./task-edit";

interface TaskBubbleProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
  isCurrent?: boolean;
}

export function TaskBubble({ task, onComplete, onUpdate, isCurrent }: TaskBubbleProps) {
  const config = categoryConfig[task.category];
  const sizeClass = getBubbleSize(task.durationMinutes);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm
        ${config.bgColor} ${sizeClass}
        ${isCurrent ? "ring-2 ring-offset-2 ring-red-400" : ""}
        cursor-pointer transition-all
      `}
    >
      <span className="text-2xl">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${config.color}`}>
          {task.title}
        </p>
        {task.durationMinutes && (
          <p className="text-xs text-gray-600">
            {formatDuration(task.durationMinutes)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onUpdate && (
          <TaskEditDialog task={task} onSave={onUpdate} />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          className="
            flex h-8 w-8 items-center justify-center rounded-full
            bg-white/80 hover:bg-white transition-colors
            shadow-sm
          "
        >
          <Check className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </motion.div>
  );
}
