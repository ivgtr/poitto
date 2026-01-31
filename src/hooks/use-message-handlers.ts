"use client";

import { useCallback } from "react";
import { Task } from "@/types/task";
import { TaskInfo } from "@/domain/task/task-fields";
import { toTaskInfo } from "@/types/chat";
import { taskService } from "@/services/task-service";
import {
  mapSelectionToField,
  generateNextQuestion,
  canRegisterTask,
} from "@/services/task-conversation-service";
import { toast } from "sonner";

interface MessageHandlerProps {
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
    type: "question" | "confirmation" | "complete" | "cancelled" | "initial";
    taskInfo?: TaskInfo;
    options?: string[];
    isComplete?: boolean;
  }) => void;
  addSystemMessage: (content: string, type: "initial" | "cancelled") => void;
  processInput: (input: string, config: any) => Promise<{
    result: any;
    isComplete: boolean;
  }>;
  updateField: (field: keyof TaskInfo, value: any) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFirstInput: (value: boolean) => void;
  reset: () => void;
}

export function useMessageHandlers({
  userId,
  conversation,
  isFirstInput,
  pendingTaskInfo,
  onTaskCreated,
  addUserMessage,
  addAssistantMessage,
  addSystemMessage,
  processInput,
  updateField,
  setIsLoading,
  setIsFirstInput,
  reset,
}: MessageHandlerProps) {
  const handleSendMessage = useCallback(async (message: string, config: any) => {
    addUserMessage(message);
    setIsLoading(true);

    try {
      const { result, isComplete } = await processInput(message, config);
      const updatedTaskInfo = result?.taskInfo || conversation.currentTaskInfo;

      if (isComplete) {
        pendingTaskInfo.current = updatedTaskInfo ? toTaskInfo(updatedTaskInfo) : null;
        
        if (isFirstInput) {
          setIsFirstInput(false);
          const { field, question, options } = generateNextQuestion(
            updatedTaskInfo,
            false
          );
          
          if (field) {
            addAssistantMessage({
              content: question,
              type: "question",
              taskInfo: updatedTaskInfo ? toTaskInfo(updatedTaskInfo) : toTaskInfo(conversation.currentTaskInfo),
              options: [...options, "スキップ"],
            });
          } else {
            addAssistantMessage({
              content: "以下のタスクを登録しますか？",
              type: "confirmation",
              taskInfo: updatedTaskInfo ? toTaskInfo(updatedTaskInfo) : toTaskInfo(conversation.currentTaskInfo),
              options: ["登録する", "登録しない"],
            });
          }
        } else {
          addAssistantMessage({
            content: "以下のタスクを登録しますか？",
            type: "confirmation",
            taskInfo: updatedTaskInfo ? toTaskInfo(updatedTaskInfo) : toTaskInfo(conversation.currentTaskInfo),
            options: ["登録する", "登録しない"],
          });
        }
      } else {
        const { question, options } = generateNextQuestion(
          updatedTaskInfo,
          true
        );

        addAssistantMessage({
          content: question,
          type: "question",
          taskInfo: updatedTaskInfo ? toTaskInfo(updatedTaskInfo) : toTaskInfo(conversation.currentTaskInfo),
          options: [...options],
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("タスクの解析に失敗しました");
      addSystemMessage(
        "申し訳ありません。解析に失敗しました。もう一度入力してください。",
        "initial"
      );
    } finally {
      setIsLoading(false);
    }
  }, [addUserMessage, addAssistantMessage, addSystemMessage, conversation.currentTaskInfo, isFirstInput, pendingTaskInfo, processInput, setIsFirstInput, setIsLoading]);

  const handleSelectOption = useCallback(async (option: string) => {
    if (option === "登録しない") {
      addSystemMessage("タスクの登録をキャンセルしました。", "cancelled");
      return { type: "cancelled" as const };
    }

    const mapping = mapSelectionToField(
      option,
      conversation.currentField,
      conversation.currentTaskInfo
    );

    if (!mapping.success && option !== "登録する") {
      return { type: "send_message" as const, message: option };
    }

    if (option === "登録する") {
      const taskInfoToRegister = pendingTaskInfo.current || toTaskInfo(conversation.currentTaskInfo);
      
      if (!canRegisterTask(taskInfoToRegister)) {
        toast.error("タスク情報が不完全です");
        return { type: "error" as const };
      }

      try {
        const newTask = await taskService.create(
          taskInfoToRegister,
          userId
        );
        
        onTaskCreated(newTask);

        addAssistantMessage({
          content: "タスクを登録しました！",
          type: "complete",
          taskInfo: taskInfoToRegister,
          isComplete: true,
        });

        reset();
        toast.success("タスクを追加しました");
        return { type: "registered" as const, task: newTask };
      } catch (error) {
        toast.error("タスクの登録に失敗しました");
        return { type: "error" as const };
      }
    }

    if (mapping.field) {
      updateField(mapping.field, mapping.value);
    }

    const { field, question, options } = generateNextQuestion({
      ...conversation.currentTaskInfo,
      [mapping.field || ""]: mapping.value,
    });

    if (field) {
      addAssistantMessage({
        content: question,
        type: "question",
        taskInfo: toTaskInfo({ ...conversation.currentTaskInfo, [mapping.field || ""]: mapping.value }),
        options: [...options],
      });
    } else {
      addAssistantMessage({
        content: "以下のタスクを登録しますか？",
        type: "confirmation",
        taskInfo: toTaskInfo(conversation.currentTaskInfo),
        options: ["登録する", "登録しない"],
      });
    }

    return { type: "continue" as const };
  }, [addAssistantMessage, addSystemMessage, conversation.currentField, conversation.currentTaskInfo, onTaskCreated, pendingTaskInfo, reset, updateField, userId]);

  return {
    handleSendMessage,
    handleSelectOption,
  };
}
