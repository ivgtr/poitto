"use client";

import { KanbanCard } from "@/components/kanban/kanban-card";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { getActiveTasks } from "@/domain/task/task-filter";
import { Task } from "@/types/task";

type BoardColumnId = "overdue" | "today" | "soon" | "later" | "no_deadline";

interface BoardColumn {
  id: BoardColumnId;
  title: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
  onComplete?: (taskId: string) => Promise<void>;
}

const BOARD_COLUMNS: BoardColumn[] = [
  { id: "overdue", title: "期限切れ" },
  { id: "today", title: "今日" },
  { id: "soon", title: "近い（1〜3日）" },
  { id: "later", title: "先の予定" },
  { id: "no_deadline", title: "期限なし" },
];

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getDiffDays(deadline: Date, baseDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const deadlineStart = startOfDay(deadline);
  const baseStart = startOfDay(baseDate);
  return Math.floor((deadlineStart.getTime() - baseStart.getTime()) / msPerDay);
}

function getColumnId(task: Task, today: Date): BoardColumnId {
  if (!task.deadline) return "no_deadline";
  const diffDays = getDiffDays(new Date(task.deadline), today);

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return "later";
}

function compareByDeadline(left: Task, right: Task): number {
  const leftDate = left.deadline ? new Date(left.deadline).getTime() : 0;
  const rightDate = right.deadline ? new Date(right.deadline).getTime() : 0;
  return leftDate - rightDate;
}

function compareByCreatedAt(left: Task, right: Task): number {
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

export function KanbanBoard({ tasks, onUpdate, onComplete }: KanbanBoardProps) {
  const today = new Date();
  const activeTasks = getActiveTasks(tasks);

  const groupedTasks = BOARD_COLUMNS.reduce<Record<BoardColumnId, Task[]>>(
    (acc, column) => {
      acc[column.id] = [];
      return acc;
    },
    {
      overdue: [],
      today: [],
      soon: [],
      later: [],
      no_deadline: [],
    }
  );

  activeTasks.forEach((task) => {
    const columnId = getColumnId(task, today);
    groupedTasks[columnId].push(task);
  });

  BOARD_COLUMNS.forEach((column) => {
    const columnTasks = groupedTasks[column.id];
    if (column.id === "no_deadline") {
      columnTasks.sort(compareByCreatedAt);
    } else {
      columnTasks.sort(compareByDeadline);
    }
  });

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-5 md:overflow-x-auto md:pb-2">
      {BOARD_COLUMNS.map((column) => {
        const columnTasks = groupedTasks[column.id];
        return (
          <KanbanColumn
            key={column.id}
            title={column.title}
            count={columnTasks.length}
          >
            {columnTasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-400">
                タスクなし
              </p>
            ) : (
              columnTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onUpdate={onUpdate}
                  onComplete={onComplete}
                />
              ))
            )}
          </KanbanColumn>
        );
      })}
    </div>
  );
}
