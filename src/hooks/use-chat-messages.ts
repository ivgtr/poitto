import { useState, useCallback } from "react";
import { ChatMessage } from "@/components/chat-interface";
import { TaskInfo } from "@/lib/task-fields";

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  addUserMessage: (content: string) => string;
  addAssistantMessage: (params: {
    content: string;
    type?: ChatMessage["type"];
    taskInfo?: TaskInfo;
    options?: string[];
    isComplete?: boolean;
  }) => string;
  addSystemMessage: (content: string, type: ChatMessage["type"]) => void;
  clearMessages: () => void;
}

export function useChatMessages(): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const generateId = () => Date.now().toString();

  const addUserMessage = useCallback((content: string): string => {
    const id = generateId();
    setMessages((prev) => [
      ...prev,
      { id, role: "user", content },
    ]);
    return id;
  }, []);

  const addAssistantMessage = useCallback(({
    content,
    type,
    taskInfo,
    options,
    isComplete,
  }: {
    content: string;
    type?: ChatMessage["type"];
    taskInfo?: TaskInfo;
    options?: string[];
    isComplete?: boolean;
  }): string => {
    const id = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id,
        role: "assistant",
        content,
        type,
        taskInfo,
        options,
        isComplete,
      },
    ]);
    return id;
  }, []);

  const addSystemMessage = useCallback((content: string, type: ChatMessage["type"]) => {
    const id = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id,
        role: "assistant",
        content,
        type,
      },
    ]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    clearMessages,
  };
}
