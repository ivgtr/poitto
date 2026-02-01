"use client";

import { MessageHandlerProps } from "./types";
import { useMessageSender } from "./use-message-sender";
import { useTaskRegistration } from "./use-task-registration";

export function useMessageHandlers(props: MessageHandlerProps) {
  const {
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
  } = props;

  const { handleSendMessage } = useMessageSender({
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    processInput,
    setIsLoading,
    setIsFirstInput,
    setCurrentField,
    pendingTaskInfo,
    conversation,
    isFirstInput,
  });

  const { handleSelectOption } = useTaskRegistration({
    userId,
    addAssistantMessage,
    addSystemMessage,
    updateField,
    setCurrentField,
    reset,
    onTaskCreated,
    pendingTaskInfo,
    conversation,
  });

  return {
    handleSendMessage,
    handleSelectOption,
  };
}

// 型をエクスポート
export type { MessageHandlerProps, MessageType, SystemMessageType, RegisterResult, SelectOptionResult } from "./types";
