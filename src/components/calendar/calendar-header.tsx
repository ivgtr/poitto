"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekRangeLabel,
} from "@/components/calendar/calendar-utils";

type CalendarViewMode = "day" | "week" | "month";

interface CalendarHeaderProps {
  selectedDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onDateChange: (date: Date) => void;
}

export function CalendarHeader({
  selectedDate,
  viewMode,
  onViewModeChange,
  onDateChange,
}: CalendarHeaderProps) {
  const handlePrev = () => {
    if (viewMode === "day") onDateChange(addDays(selectedDate, -1));
    if (viewMode === "week") onDateChange(addDays(selectedDate, -7));
    if (viewMode === "month") onDateChange(addMonths(selectedDate, -1));
  };

  const handleNext = () => {
    if (viewMode === "day") onDateChange(addDays(selectedDate, 1));
    if (viewMode === "week") onDateChange(addDays(selectedDate, 7));
    if (viewMode === "month") onDateChange(addMonths(selectedDate, 1));
  };

  const title =
    viewMode === "month"
      ? formatMonthLabel(selectedDate)
      : viewMode === "week"
      ? formatWeekRangeLabel(selectedDate)
      : selectedDate.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        });

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={() => onDateChange(new Date())}>
          今日
        </Button>
        <div className="ml-2 text-sm font-semibold text-gray-800">{title}</div>
      </div>
      <div className="flex gap-2">
        <Button
          variant={viewMode === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("day")}
        >
          日
        </Button>
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("week")}
        >
          週
        </Button>
        <Button
          variant={viewMode === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("month")}
        >
          月
        </Button>
      </div>
    </div>
  );
}
