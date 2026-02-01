"use client";

import { Task } from "@/types/task";
import { TaskInfo } from "@/domain/task/task-fields";
import { ParseResult } from "@/types/chat";
import { LlmConfig } from "@/lib/local-storage";

export type MessageType = "question" | "confirmation" | "complete" | "cancelled" | "initial";
export type SystemMessageType = "initial" | "cancelled";

export interface MessageHandlerProps {
  userId: string;
  conversation: {
    currentField: string | null;
    currentTaskInfo: Partial<TaskInfo>;
  };
  isFirstInput: boolean;
  pendingTaskInfo: React.MutableRefObject<TaskInfo | null>;
  onTaskCreated: (task: Task) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (data: {
    content: string;
    type: MessageType;
    taskInfo?: TaskInfo;
    options?: string[];
    isComplete?: boolean;
  }) => void;
  addSystemMessage: (content: string, type: SystemMessageType) => void;
  processInput: (input: string, config: LlmConfig) => Promise<{
    result: ParseResult | null;
    isComplete: boolean;
  }>;
  updateField: (field: keyof TaskInfo, value: TaskInfo[keyof TaskInfo]) => void;
  setCurrentField: (field: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFirstInput: (value: boolean) => void;
  reset: () => void;
}

export type RegisterResult =
  | { type: "registered"; task: Task }
  | { type: "error" };

export type SelectOptionResult =
  | { type: "registered"; task: Task }
  | { type: "cancelled" }
  | { type: "continue" }
  | { type: "send_message"; message: string };
