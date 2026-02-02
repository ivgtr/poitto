"use client";

import { useCallback, useState } from "react";
import { CheckCircle } from "lucide-react";
import { CalendarEventDetail } from "@/components/calendar/calendar-event-detail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { categoryConfig } from "@/lib/task-utils";
import { Task } from "@/types/task";

interface CalendarEventCardProps {
  task: Task;
  top: number;
  height: number;
  timeLabel?: string;
  onComplete?: (taskId: string) => Promise<void>;
  onUpdate?: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
}

export function CalendarEventCard({
  task,
  top,
  height,
  timeLabel,
  onComplete,
  onUpdate,
}: CalendarEventCardProps) {
  const config = categoryConfig[task.category];
  const isDone = task.status === "done";
  const showTime = height >= 48;
  const titleClamp =
    height < 32
      ? "line-clamp-1"
      : height < 48
      ? "line-clamp-2"
      : height < 72
      ? "line-clamp-2"
      : "line-clamp-3";
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = useState(false);
  const handleDelete = useCallback(() => {
    setOpen(false);
  }, []);

  const handleComplete = async () => {
    if (onComplete) {
      await onComplete(task.id);
    }
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const trigger = (
    <button
      type="button"
      className={`absolute left-2 right-4 rounded-md border px-2 pt-1 pb-0 text-xs overflow-hidden text-left flex flex-col items-start justify-start ${
        isDone
          ? "bg-gray-100 border-dashed border-gray-300 text-gray-400 shadow-none"
          : "bg-white border-gray-200 shadow-sm"
      }`}
      style={{ top, height }}
    >
      {isDone && (
        <span className="absolute left-2 top-2 text-gray-400">
          <CheckCircle className="h-3 w-3" />
        </span>
      )}
      <p
        className={`font-semibold break-words ${titleClamp} ${
          isDone ? "pl-4" : ""
        } ${isDone ? "text-gray-500" : config.color}`}
      >
        {task.title}
      </p>
      {showTime && timeLabel && (
        <p
          className={`text-xs line-clamp-1 ${
            isDone ? "text-gray-400 pl-4" : "text-gray-600"
          }`}
        >
          {timeLabel}
        </p>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl" showCloseButton={false}>
          <SheetHeader className="pb-0">
            <CalendarEventDetail
              task={task}
              onUpdate={onUpdate}
              onDelete={handleDelete}
              onClose={handleClose}
              onComplete={handleComplete}
              showComplete={false}
            />
          </SheetHeader>
            {onComplete && !isDone && (
              <SheetFooter>
              <button
                type="button"
                onClick={handleComplete}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                完了
              </button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-[320px] p-4"
      >
        <CalendarEventDetail
          task={task}
          onUpdate={onUpdate}
          onDelete={handleDelete}
          onClose={handleClose}
          onComplete={handleComplete}
          showComplete={Boolean(onComplete) && !isDone}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
