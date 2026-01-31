"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types/task";
import { taskService } from "@/services/task-service";
import { toast } from "sonner";

interface UseTaskListProps {
  initialTasks: Task[];
}

interface UseTaskListReturn {
  tasks: Task[];
  completeTask: (taskId: string) => Promise<void>;
  addTask: (newTask: Task) => void;
}

export function useTaskList({ initialTasks }: UseTaskListProps): UseTaskListReturn {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await taskService.complete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("タスクを完了しました");
    } catch (error) {
      toast.error("エラーが発生しました");
    }
  }, []);

  const addTask = useCallback((newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  return {
    tasks,
    completeTask,
    addTask,
  };
}
