"use client";

import { useState, useRef, useCallback } from "react";
import { Task } from "@/types/task";
import { TaskInfo } from "@/domain/task/task-fields";
import { getLlmConfig } from "@/lib/local-storage";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useTaskConversation } from "@/hooks/use-task-conversation";
import { useMessageHandlers } from "@/hooks/use-message-handlers";
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
    setCurrentField,
    processInput,
    reset: resetConversation,
  } = useTaskConversation();

  const reset = useCallback(() => {
    resetConversation();
    clearMessages();
    setIsFirstInput(true);
    pendingTaskInfo.current = null;
  }, [resetConversation, clearMessages]);

  const { handleSendMessage, handleSelectOption } = useMessageHandlers({
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
    setCurrentField,
    setIsLoading,
    setIsFirstInput,
    reset,
  });

  const sendMessage = useCallback(async (message: string) => {
    const config = getLlmConfig();

    if (!config) {
      toast.error("APIキーが設定されていません。設定画面でAPIキーを入力してください。");
      return;
    }

    await handleSendMessage(message, config);
  }, [handleSendMessage]);

  const selectOption = useCallback(async (option: string) => {
    const result = await handleSelectOption(option);
    
    if (result.type === "send_message") {
      await sendMessage(result.message);
    }
  }, [handleSelectOption, sendMessage]);

  const cancelCreation = useCallback(() => {
    addSystemMessage("タスクの登録をキャンセルしました。", "cancelled");
  }, [addSystemMessage]);

  const clearSession = useCallback(() => {
    reset();
  }, [reset]);

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
