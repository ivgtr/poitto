"use client";

interface CalendarTimeAxisProps {
  rowHeight: number;
  startHour?: number;
  endHour?: number;
}

export function CalendarTimeAxis({
  rowHeight,
  startHour = 0,
  endHour = 23,
}: CalendarTimeAxisProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    return startHour + index;
  });

  return (
    <div className="flex w-16 flex-col text-xs text-gray-400">
      {hours.map((hour) => (
        <div
          key={hour}
          className="relative flex items-start justify-end pr-2"
          style={{ height: rowHeight }}
        >
          <span className="-translate-y-2">
            {String(hour).padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}
