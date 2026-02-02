"use client";

interface CalendarTimeGridProps {
  rowHeight: number;
  hourCount?: number;
}

export function CalendarTimeGrid({
  rowHeight,
  hourCount = 24,
}: CalendarTimeGridProps) {
  const rows = Array.from({ length: hourCount }, (_, index) => index);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {rows.map((row) => (
        <div
          key={row}
          className="border-t border-gray-200/70"
          style={{ height: rowHeight }}
        />
      ))}
    </div>
  );
}
