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
  updateTask: (taskId: string, updatedTask: Task) => void;
}

export function useTaskList({ initialTasks }: UseTaskListProps): UseTaskListReturn {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      const updatedTask = await taskService.complete(taskId);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
      toast.success("タスクを完了しました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }, []);

  const addTask = useCallback((newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((taskId: string, updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );
  }, []);

  return {
    tasks,
    completeTask,
    addTask,
    updateTask,
  };
}
