"use client";

import { useEffect, useRef } from "react";
import { CalendarAllDayRow } from "@/components/calendar/calendar-all-day-row";
import { CalendarDayHeaders } from "@/components/calendar/calendar-day-headers";
import { CalendarEventCard } from "@/components/calendar/calendar-event-card";
import { CalendarTimeAxis } from "@/components/calendar/calendar-time-axis";
import { CalendarTimeGrid } from "@/components/calendar/calendar-time-grid";
import {
  addDays,
  formatTimeRange,
  getMinutesFromStartOfDay,
  isSameDate,
  startOfWeek,
} from "@/components/calendar/calendar-utils";
import { getScheduledTasks } from "@/domain/task/task-filter";
import { Task } from "@/types/task";

interface CalendarWeekViewProps {
  tasks: Task[];
  selectedDate: Date;
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

export function CalendarWeekView({
  tasks,
  selectedDate,
  onComplete,
  onUpdate,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const rowHeight = 56;
  const hourCount = 24;
  const gridHeight = rowHeight * hourCount;
  const minimumEventHeight = 24;

  const scheduledTasks = getScheduledTasks(tasks);
  const now = new Date();
  const nowTop = (getMinutesFromStartOfDay(now) / 60) * rowHeight;
  const todayIndex = days.findIndex((day) => isSameDate(day, now));
  const showNowLine = todayIndex >= 0;
  const todayLeft = `calc(${(100 / days.length) * todayIndex}%)`;
  const todayWidth = `calc(${100 / days.length}%)`;
  const nowLineRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    if (!showNowLine || hasAutoScrolled.current) return;
    if (!nowLineRef.current) return;
    nowLineRef.current.scrollIntoView({ block: "center" });
    hasAutoScrolled.current = true;
  }, [showNowLine]);

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-20 bg-neutral-50">
        <div className="flex">
          <div className="w-16">
            <div className="h-8 text-[10px] text-gray-400">GMT+09</div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[720px]">
              <CalendarDayHeaders days={days} />
            </div>
          </div>
        </div>
      </div>
      <CalendarAllDayRow
        days={days}
        tasks={scheduledTasks}
        onComplete={onComplete}
        onUpdate={onUpdate}
      />
      <div className="flex">
        <div className="w-16">
          <CalendarTimeAxis rowHeight={rowHeight} />
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="relative min-w-[720px]" style={{ height: gridHeight }}>
            <CalendarTimeGrid rowHeight={rowHeight} hourCount={hourCount} />
              {showNowLine && (
                <div
                  className="absolute z-10 h-px bg-red-500"
                  style={{ top: nowTop, left: todayLeft, width: todayWidth }}
                  ref={nowLineRef}
                >
                  <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
                </div>
              )}
            <div
              className="relative grid h-full"
              style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {days.map((day) => {
                  const dayTasks = scheduledTasks.filter(
                    (task) => task.scheduledAt && isSameDate(task.scheduledAt, day)
                  );
                return (
                  <div key={day.toISOString()} className="relative border-l border-gray-200">
                    {dayTasks.map((task) => {
                      const scheduledAt = task.scheduledAt!;
                      const minutes = getMinutesFromStartOfDay(scheduledAt);
                      const durationMinutes = task.durationMinutes ?? 30;
                      const top = (minutes / 60) * rowHeight;
                      const height = Math.max(
                        (durationMinutes / 60) * rowHeight,
                        minimumEventHeight
                      );
                      const timeLabel = formatTimeRange(scheduledAt, durationMinutes);

                        return (
                          <CalendarEventCard
                            key={task.id}
                            task={task}
                            top={top}
                            height={height}
                            timeLabel={timeLabel}
                            onComplete={onComplete}
                            onUpdate={onUpdate}
                          />
                        );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
