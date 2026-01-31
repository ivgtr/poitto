"use client";

import { useState } from "react";
import { Task } from "@/types/task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { useTaskEditForm } from "./use-task-edit-form";
import { TaskEditForm } from "./task-edit-form";

interface TaskEditDialogProps {
  task: Task;
  onSave: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
}

export function TaskEditDialog({ task, onSave }: TaskEditDialogProps) {
  const [open, setOpen] = useState(false);
  
  const {
    title,
    setTitle,
    category,
    setCategory,
    deadline,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    isLoading,
    canSave,
    handleSave,
    clearDeadline,
    clearScheduled,
    clearDuration,
  } = useTaskEditForm({
    task,
    onSave,
    onClose: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="
            flex h-8 w-8 items-center justify-center rounded-full
            bg-white/80 hover:bg-white transition-colors
            shadow-sm text-gray-600 hover:text-violet-600
          "
          title="編集"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>タスクを編集</DialogTitle>
        </DialogHeader>
        <TaskEditForm
          title={title}
          setTitle={setTitle}
          category={category}
          setCategory={setCategory}
          deadline={deadline}
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          durationMinutes={durationMinutes}
          canSave={canSave}
          isLoading={isLoading}
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          clearDeadline={clearDeadline}
          clearScheduled={clearScheduled}
          clearDuration={clearDuration}
        />
      </DialogContent>
    </Dialog>
  );
}
