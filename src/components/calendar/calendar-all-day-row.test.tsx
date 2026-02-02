import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CalendarAllDayRow } from "@/components/calendar/calendar-all-day-row";
import type { Task } from "@/types/task";

describe("CalendarAllDayRow", () => {
  it("renders date-only tasks in all-day row", () => {
    const day = new Date("2026-02-03T00:00:00+09:00");
    const tasks: Task[] = [
      {
        id: "task-1",
        userId: "user-1",
        title: "終日タスク",
        category: "work",
        status: "scheduled",
        scheduledDate: "2026-02-03",
        scheduledAt: null,
        deadline: null,
        durationMinutes: null,
        rawInput: null,
        createdAt: new Date("2026-02-01T00:00:00+09:00"),
        updatedAt: new Date("2026-02-01T00:00:00+09:00"),
        completedAt: null,
      },
    ];

    render(
      <CalendarAllDayRow
        days={[day]}
        tasks={tasks}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText("終日タスク")).toBeInTheDocument();
  });
});
