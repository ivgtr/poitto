"use client";

import { motion } from "framer-motion";
import { TaskBubble } from "@/components/task-bubble";
import { Task } from "@/types/task";


interface TimelineProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
  selectedDate?: Date;
  showCurrentTimeLine?: boolean;
}

function isSameDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function Timeline({
  tasks,
  onComplete,
  onUpdate,
  selectedDate,
  showCurrentTimeLine = true,
}: TimelineProps) {
  const targetDate = selectedDate ?? new Date();
  const scheduledTasks = tasks.filter((t) => {
    if (t.status !== "scheduled" || !t.scheduledAt) return false;
    const scheduledAt = new Date(t.scheduledAt);
    return isSameDate(scheduledAt, targetDate);
  });
  const currentHour = new Date().getHours();
  const shouldShowCurrentLine = showCurrentTimeLine && isSameDate(targetDate, new Date());

  // 時間帯ごとにタスクをグループ化
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative space-y-2">
      {/* 現在時刻ライン */}
      {shouldShowCurrentLine && (
        <motion.div
          className="absolute left-0 right-0 z-10 h-0.5 bg-red-500"
          style={{ top: `${(currentHour / 24) * 100}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute -left-2 -top-1.5 h-4 w-4 rounded-full bg-red-500" />
        </motion.div>
      )}

      {timeSlots.map((hour) => {
        const hourTasks = scheduledTasks.filter((task) => {
          if (!task.scheduledAt) return false;
          const taskHour = new Date(task.scheduledAt).getHours();
          return taskHour === hour;
        });

        const isCurrentHour = hour === currentHour;

        return (
          <div
            key={hour}
            className={`
              flex gap-4 rounded-lg p-2
              ${isCurrentHour ? "bg-red-50/50" : "hover:bg-gray-50"}
            `}
          >
            <div className="w-14 shrink-0 text-sm text-gray-500">
              {hour.toString().padStart(2, "0")}:00
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {hourTasks.map((task) => (
                <TaskBubble
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onUpdate={onUpdate}
                  isCurrent={isCurrentHour}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
