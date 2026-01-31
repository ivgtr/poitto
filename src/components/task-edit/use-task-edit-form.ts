"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types/task";

interface UseTaskEditFormProps {
  task: Task;
  onSave: (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
  onClose: () => void;
}

interface UseTaskEditFormReturn {
  title: string;
  setTitle: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  deadline: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: string;
  isLoading: boolean;
  canSave: boolean;
  handleSave: () => Promise<void>;
  clearDeadline: () => void;
  clearScheduled: () => void;
  clearDuration: () => void;
}

export function useTaskEditForm({
  task,
  onSave,
  onClose,
}: UseTaskEditFormProps): UseTaskEditFormReturn {
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<string>(task.category);
  const [deadline, setDeadline] = useState<string>(
    task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    task.scheduledAt ? new Date(task.scheduledAt).toISOString().split('T')[0] : ''
  );
  const [scheduledTime, setScheduledTime] = useState<string>(
    task.scheduledAt 
      ? new Date(task.scheduledAt).toTimeString().slice(0, 5) 
      : ''
  );
  const [durationMinutes, setDurationMinutes] = useState<string>(
    task.durationMinutes?.toString() || ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      const data = {
        title: title.trim(),
        category,
        deadline: deadline ? new Date(deadline) : null,
        scheduledAt: null as Date | null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      };

      // 予定日時の設定
      if (scheduledDate && scheduledTime) {
        data.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      } else if (scheduledDate) {
        data.scheduledAt = new Date(`${scheduledDate}T00:00:00`);
      }

      await onSave(task.id, data);
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsLoading(false);
    }
  }, [task.id, title, category, deadline, scheduledDate, scheduledTime, durationMinutes, onSave, onClose]);

  const clearDeadline = useCallback(() => setDeadline(''), []);
  
  const clearScheduled = useCallback(() => {
    setScheduledDate('');
    setScheduledTime('');
  }, []);
  
  const clearDuration = useCallback(() => setDurationMinutes(''), []);

  return {
    title,
    setTitle,
    category,
    setCategory,
    deadline,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    isLoading,
    canSave: !!title.trim() && !isLoading,
    handleSave,
    clearDeadline,
    clearScheduled,
    clearDuration,
  };
}
