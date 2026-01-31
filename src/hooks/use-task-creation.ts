"use client";

import { useState, useRef, useCallback } from "react";
import { Task } from "@/types/task";
import { TaskInfo } from "@/domain/task/task-fields";
import { toTaskInfo } from "@/types/chat";
import { taskService } from "@/services/task-service";
import {
  mapSelectionToField,
  generateNextQuestion,
  canRegisterTask,
} from "@/services/task-conversation-service";
import { getLlmConfig } from "@/lib/local-storage";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useTaskConversation } from "@/hooks/use-task-conversation";
import { toast } from "sonner";

interface UseTaskCreationProps {
  userId: string;
  onTaskCreated: (task: Task) => void;
}

interface UseTaskCreationReturn {
  isLoading: boolean;
  isFirstInput: boolean;
  pendingTaskInfo: React.MutableRefObject<TaskInfo | null>;
  messages: ReturnType<typeof useChatMessages>["messages"];
  conversation: ReturnType<typeof useTaskConversation>["state"];
  sendMessage: (message: string) => Promise<void>;
  selectOption: (option: string) => Promise<void>;
  cancelCreation: () => void;
  reset: () => void;
  clearSession: () => void;
}

export function useTaskCreation({
  userId,
  onTaskCreated,
}: UseTaskCreationProps): UseTaskCreationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstInput, setIsFirstInput] = useState(true);
  const pendingTaskInfo = useRef<TaskInfo | null>(null);

  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    clearMessages,
  } = useChatMessages();

  const {
    state: conversation,
    updateField,
    processInput,
    reset: resetConversation,
  } = useTaskConversation();

  const sendMessage = useCallback(async (message: string) => {
    const config = getLlmConfig();

    if (!config) {
      toast.error("APIキーが設定されていません。設定画面でAPIキーを入力してください。");
      return;
    }

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
  }, [addUserMessage, addAssistantMessage, addSystemMessage, conversation.currentTaskInfo, isFirstInput, processInput]);

  const selectOption = useCallback(async (option: string) => {
    if (option === "登録しない") {
      cancelCreation();
      return;
    }

    const mapping = mapSelectionToField(
      option,
      conversation.currentField,
      conversation.currentTaskInfo
    );

    if (!mapping.success && option !== "登録する") {
      sendMessage(option);
      return;
    }

    if (option === "登録する") {
      const taskInfoToRegister = pendingTaskInfo.current || toTaskInfo(conversation.currentTaskInfo);
      
      if (!canRegisterTask(taskInfoToRegister)) {
        toast.error("タスク情報が不完全です");
        return;
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
      } catch (error) {
        toast.error("タスクの登録に失敗しました");
      }
      return;
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
  }, [addAssistantMessage, conversation.currentField, conversation.currentTaskInfo, onTaskCreated, sendMessage, updateField, userId]);

  const cancelCreation = useCallback(() => {
    addSystemMessage("タスクの登録をキャンセルしました。", "cancelled");
  }, [addSystemMessage]);

  const reset = useCallback(() => {
    resetConversation();
    clearMessages();
    setIsFirstInput(true);
    pendingTaskInfo.current = null;
  }, [resetConversation, clearMessages]);

  const clearSession = useCallback(() => {
    resetConversation();
    clearMessages();
    setIsFirstInput(true);
    pendingTaskInfo.current = null;
  }, [resetConversation, clearMessages]);

  return {
    isLoading,
    isFirstInput,
    pendingTaskInfo,
    messages,
    conversation,
    sendMessage,
    selectOption,
    cancelCreation,
    reset,
    clearSession,
  };
}
