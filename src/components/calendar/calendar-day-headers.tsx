"use client";

import { isSameDate } from "@/components/calendar/calendar-utils";

interface CalendarDayHeadersProps {
  days: Date[];
}

export function CalendarDayHeaders({ days }: CalendarDayHeadersProps) {
  const today = new Date();

  return (
    <div
      className="grid h-8 items-center border-b border-gray-200 text-sm text-gray-600"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map((day) => {
        const isToday = isSameDate(day, today);
        const weekday = day.toLocaleDateString("ja-JP", { weekday: "short" });
        const dateNumber = day.getDate();
        return (
          <div key={day.toISOString()} className="flex items-center gap-2 px-2">
            <span className="text-xs text-gray-500">{weekday}</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                isToday ? "bg-blue-600 text-white" : "text-gray-800"
              }`}
            >
              {dateNumber}
            </span>
          </div>
        );
      })}
    </div>
  );
}
