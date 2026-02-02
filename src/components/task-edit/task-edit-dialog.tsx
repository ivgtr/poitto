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
import { cn } from "@/lib/utils";
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
  buttonClassName?: string;
  iconClassName?: string;
}

export function TaskEditDialog({
  task,
  onSave,
  buttonClassName,
  iconClassName,
}: TaskEditDialogProps) {
  const [open, setOpen] = useState(false);
  
  const {
    // Form values
    title,
    category,
    deadline,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    
    // State setters
    setTitle,
    setCategory,
    setDeadline,
    setScheduledDate,
    setScheduledTime,
    setDurationMinutes,
    
    // Form state
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
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-violet-600",
            buttonClassName
          )}
          title="編集"
        >
          <Pencil className={cn("h-4 w-4", iconClassName)} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>タスクを編集</DialogTitle>
        </DialogHeader>
        <TaskEditForm
          // Form values
          title={title}
          category={category}
          deadline={deadline}
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          durationMinutes={durationMinutes}
          
          // State setters
          setTitle={setTitle}
          setCategory={setCategory}
          setDeadline={setDeadline}
          setScheduledDate={setScheduledDate}
          setScheduledTime={setScheduledTime}
          setDurationMinutes={setDurationMinutes}
          
          // Form state
          canSave={canSave}
          isLoading={isLoading}
          
          // Actions
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          clearDeadline={clearDeadline}
          clearScheduled={clearScheduled}
          clearDuration={clearDuration}
          submitLabel="保存"
        />
      </DialogContent>
    </Dialog>
  );
}
