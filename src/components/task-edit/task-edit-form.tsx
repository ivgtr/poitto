"use client";

import { TaskForm, TaskFormProps } from "@/components/task/task-form";

// Re-export TaskForm as TaskEditForm for backward compatibility
export type TaskEditFormProps = TaskFormProps;
export const TaskEditForm = TaskForm;
