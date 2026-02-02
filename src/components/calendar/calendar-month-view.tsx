"use client";

import { DayContentProps } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { formatDateKey } from "@/components/calendar/calendar-utils";
import { Task } from "@/types/task";

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
  const scheduledTasks = tasks.filter((task) => task.status === "scheduled" && task.scheduledAt);
  const taskCountByDate = scheduledTasks.reduce<Record<string, number>>((acc, task) => {
    const key = formatDateKey(new Date(task.scheduledAt));
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const DayContent = ({ date }: DayContentProps) => {
    const count = taskCountByDate[formatDateKey(date)] ?? 0;
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium text-gray-700">{date.getDate()}</span>
        {count > 0 && (
          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">
            {count}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-3 shadow-sm">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        components={{ DayContent }}
      />
    </div>
  );
}
