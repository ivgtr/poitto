"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/task/task-form";
import { useTaskCreateForm } from "@/hooks/use-task-create-form";

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: TaskCreateDialogProps) {
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

    // Actions
    handleSave,
    clearDeadline,
    clearScheduled,
    clearDuration,
    resetForm,
  } = useTaskCreateForm({
    onCreate,
    onClose: () => {
      onOpenChange(false);
      resetForm();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>タスクを作成</DialogTitle>
        </DialogHeader>
        <TaskForm
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
          onCancel={() => onOpenChange(false)}
          clearDeadline={clearDeadline}
          clearScheduled={clearScheduled}
          clearDuration={clearDuration}
          submitLabel="作成"
          loadingLabel="作成中..."
        />
      </DialogContent>
    </Dialog>
  );
}
