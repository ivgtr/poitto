"use client";

import { TaskInfo } from "@/domain/task/task-fields";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "initial" | "question" | "confirmation" | "complete" | "cancelled";
  taskInfo?: TaskInfo;
  options?: string[];
  isComplete?: boolean;
}
