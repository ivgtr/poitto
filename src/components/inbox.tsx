"use client";

import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { categoryConfig } from "@/lib/task-utils";
import { Calendar, Check } from "lucide-react";
import { TaskEditDialog } from "./task-edit";

interface InboxProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onSchedule: (taskId: string) => void;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
}

export function Inbox({ tasks, onComplete, onSchedule, onUpdate }: InboxProps) {
  const inboxTasks = tasks.filter((t) => t.status === "inbox");

  if (inboxTasks.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-6 text-center">
        <p className="text-gray-500">Inboxは空です</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Inbox ({inboxTasks.length})
      </h3>
      <div className="space-y-2">
        {inboxTasks.map((task) => {
          const config = categoryConfig[task.category];

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`
                flex items-center gap-3 rounded-xl px-4 py-3
                ${config.bgColor} border border-gray-200/50
              `}
            >
              <span className="text-xl">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${config.color}`}>
                  {task.title}
                </p>
              </div>
              <div className="flex gap-1">
                {onUpdate && (
                  <TaskEditDialog task={task} onSave={onUpdate} />
                )}
                <button
                  onClick={() => onSchedule(task.id)}
                  className="
                    flex h-8 w-8 items-center justify-center rounded-full
                    bg-white/80 hover:bg-white transition-colors
                    shadow-sm
                  "
                  title="スケジュールに追加"
                >
                  <Calendar className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => onComplete(task.id)}
                  className="
                    flex h-8 w-8 items-center justify-center rounded-full
                    bg-white/80 hover:bg-white transition-colors
                    shadow-sm
                  "
                  title="完了"
                >
                  <Check className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
