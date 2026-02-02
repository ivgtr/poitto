"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types/task";
import {
  dateToFormDateString,
  formDateStringToDeadline,
  formStringsToScheduledAt,
  durationToFormString,
  formStringToDuration,
  splitScheduledAt,
} from "@/domain/task/form-conversion";

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
  // Form values
  title: string;
  category: string;
  deadline: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: string;
  
  // State setters
  setTitle: (value: string) => void;
  setCategory: (value: string) => void;
  setDeadline: (value: string) => void;
  setScheduledDate: (value: string) => void;
  setScheduledTime: (value: string) => void;
  setDurationMinutes: (value: string) => void;
  
  // Form state
  isLoading: boolean;
  canSave: boolean;
  
  // Actions
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
  // Initialize form state with proper conversions
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<string>(task.category);
  const [deadline, setDeadline] = useState<string>(
    dateToFormDateString(task.deadline)
  );
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const { date } = splitScheduledAt(task.scheduledAt);
    return date;
  });
  const [scheduledTime, setScheduledTime] = useState<string>(() => {
    const { time } = splitScheduledAt(task.scheduledAt);
    return time;
  });
  const [durationMinutes, setDurationMinutes] = useState<string>(
    durationToFormString(task.durationMinutes)
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      // Convert form strings to proper Date objects with JST timezone
      const deadlineDate = formDateStringToDeadline(deadline);
      const scheduledAtDate = formStringsToScheduledAt(scheduledDate, scheduledTime);
      const duration = formStringToDuration(durationMinutes);

      const data = {
        title: title.trim(),
        category,
        deadline: deadlineDate,
        scheduledAt: scheduledAtDate,
        durationMinutes: duration,
      };

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
    canSave: !!title.trim() && !isLoading,
    
    // Actions
    handleSave,
    clearDeadline,
    clearScheduled,
    clearDuration,
  };
}
