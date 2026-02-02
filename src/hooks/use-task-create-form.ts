"use client";

import { useState, useCallback } from "react";
import {
  formDateStringToDeadline,
  formDateStringToScheduledDate,
  formStringsToScheduledAt,
  formStringToDuration,
} from "@/domain/task/form-conversion";

interface UseTaskCreateFormProps {
  onCreate: (data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => Promise<void>;
  onClose: () => void;
}

interface UseTaskCreateFormReturn {
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
  resetForm: () => void;
}

export function useTaskCreateForm({
  onCreate,
  onClose,
}: UseTaskCreateFormProps): UseTaskCreateFormReturn {
  // Initialize with empty/default values
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [deadline, setDeadline] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      // Convert form strings to proper Date objects with JST timezone
      const deadlineDate = formDateStringToDeadline(deadline);
      const scheduledDateValue = formDateStringToScheduledDate(scheduledDate);
      const scheduledAtDate = formStringsToScheduledAt(
        scheduledDate,
        scheduledTime
      );
      const duration = formStringToDuration(durationMinutes);

      const data = {
        title: title.trim(),
        category,
        deadline: deadlineDate,
        scheduledDate: scheduledDateValue,
        scheduledAt: scheduledAtDate,
        durationMinutes: duration,
      };

      await onCreate(data);
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    category,
    deadline,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    onCreate,
    onClose,
  ]);

  const clearDeadline = useCallback(() => setDeadline(""), []);

  const clearScheduled = useCallback(() => {
    setScheduledDate("");
    setScheduledTime("");
  }, []);

  const clearDuration = useCallback(() => setDurationMinutes(""), []);

  const resetForm = useCallback(() => {
    setTitle("");
    setCategory("other");
    setDeadline("");
    setScheduledDate("");
    setScheduledTime("");
    setDurationMinutes("");
  }, []);

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
    resetForm,
  };
}
