"use client";

import * as React from "react";
import { getDefaultClassNames } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { formatDateKey } from "@/components/calendar/calendar-utils";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

interface CalendarMonthViewProps {
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (date: Date | undefined) => void;
}

export function CalendarMonthView({
  tasks,
  selectedDate,
  onSelectDate,
}: CalendarMonthViewProps) {
  const scheduledTasks = tasks.filter(
    (task): task is Task & { scheduledAt: Date } =>
      task.status === "scheduled" && task.scheduledAt !== null
  );
  const taskCountByDate = scheduledTasks.reduce<Record<string, number>>(
    (acc, task) => {
      const key = formatDateKey(task.scheduledAt);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // Get dates that have tasks
  const datesWithTasks = Object.keys(taskCountByDate).map(
    (key) => new Date(key)
  );

  const defaultClassNames = getDefaultClassNames();

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-3 shadow-sm">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        modifiers={{
          hasTasks: datesWithTasks,
        }}
        modifiersClassNames={{
          hasTasks: "relative",
        }}
        classNames={{
          day: cn(
            "relative w-full h-full p-0 text-center group/day aspect-square select-none",
            defaultClassNames.day
          ),
          day_button: cn(
            "flex aspect-square size-auto w-full min-w-8 flex-col items-center justify-center gap-0.5 leading-none font-normal",
            defaultClassNames.day_button
          ),
        }}
        formatters={{
          formatDay: (date) => {
            const count = taskCountByDate[formatDateKey(date)] ?? 0;
            return `${date.getDate()}${count > 0 ? `(${count})` : ""}`;
          },
        }}
      />
    </div>
  );
}
