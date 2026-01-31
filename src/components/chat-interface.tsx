"use client";

import { ChatMessage } from "./chat/chat-types";
import { ChatMessages } from "./chat/chat-messages";
import { ChatInput } from "./chat/chat-input";

export type { ChatMessage } from "./chat/chat-types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSelectOption: (option: string, messageId: string) => void;
  onCancel: (messageId: string) => void;
  isLoading: boolean;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onSelectOption,
  onCancel,
  isLoading,
}: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-full">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        onSelectOption={onSelectOption}
        onCancel={onCancel}
      />
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}
