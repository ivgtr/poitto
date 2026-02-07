"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ChatMessage } from "./chat-types";
import { ChatMessageItem } from "./chat-message-item";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSelectOption: (option: string, messageId: string) => void;
  onCancel: (messageId: string) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  onSelectOption,
  onCancel,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4 pb-32">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-lg font-medium mb-2">タスクを追加</p>
          <p className="text-sm">自然言語でタスクを入力してください</p>
          <p className="text-sm mt-1 text-gray-300">
            例：「明日までに〇〇への返信」
          </p>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          onSelectOption={onSelectOption}
          onCancel={onCancel}
        />
      ))}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
            <span className="text-sm text-gray-600">考え中...</span>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
