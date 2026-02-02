"use client";

import { Check } from "lucide-react";
import { TaskEditDialog } from "@/components/task-edit";
import { formatDateKey, isSameDateString } from "@/components/calendar/calendar-utils";
import { Task } from "@/types/task";

interface CalendarAllDayRowProps {
  days: Date[];
  tasks: Task[];
  onComplete: (taskId: string) => Promise<void>;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
}

export function CalendarAllDayRow({
  days,
  tasks,
  onComplete,
  onUpdate,
}: CalendarAllDayRowProps) {
  const allDayTasks = tasks.filter(
    (task) => task.scheduledDate && !task.scheduledAt
  );

  return (
    <div className="flex">
      <div className="w-16">
        <div className="h-8 text-[10px] text-gray-400">終日</div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((day) => {
              const key = formatDateKey(day);
              const dayTasks = allDayTasks.filter((task) =>
                isSameDateString(task.scheduledDate!, day)
              );
              return (
                <div key={key} className="border-l border-gray-200 px-2 py-1">
                  <div className="space-y-1">
                    {dayTasks.map((task) => {
                      const isDone = task.status === "done";
                      const item = (
                        <div
                          className={
                            "group flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors " +
                            (isDone
                              ? "border-dashed border-gray-300 bg-gray-100 text-gray-400"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
                          }
                        >
                          {!isDone && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onComplete(task.id);
                              }}
                              className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                              title="完了"
                              aria-label="タスクを完了"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {task.title}
                          </span>
                        </div>
                      );

                      if (!onUpdate) {
                        return <div key={task.id}>{item}</div>;
                      }

                      return (
                        <TaskEditDialog
                          key={task.id}
                          task={task}
                          onSave={onUpdate}
                          trigger={item}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
