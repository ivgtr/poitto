"use client";

import { useState, useCallback } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ChatFab } from "./chat-fab";
import { ChatSidebar } from "./chat-sidebar";
import { ChatInterface, ChatMessage } from "@/components/chat-interface";

interface ChatContainerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSelectOption: (option: string, messageId: string) => void;
  onCancel: (messageId: string) => void;
  isLoading: boolean;
  onNewChat: () => void;
}

export function ChatContainer({
  isOpen,
  onOpenChange,
  messages,
  onSendMessage,
  onSelectOption,
  onCancel,
  isLoading,
  onNewChat,
}: ChatContainerProps) {
  const [viewMode, setViewMode] = useState<"sidebar" | "floating">("sidebar");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleToggle = useCallback(() => {
    onOpenChange(!isOpen);
  }, [isOpen, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleViewModeChange = useCallback((mode: "sidebar" | "floating") => {
    setViewMode(mode);
  }, []);

  // Mobile: Don't render here, will be on /chat page
  if (isMobile) {
    return null;
  }

  return (
    <>
      {/* FAB Button - shown when sidebar is closed */}
      {!isOpen && <ChatFab isOpen={isOpen} onClick={handleToggle} />}

      {/* Sidebar Panel */}
      <ChatSidebar
        isOpen={isOpen}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onNewChat={onNewChat}
        onClose={handleClose}
      >
        <ChatInterface
          messages={messages}
          onSendMessage={onSendMessage}
          onSelectOption={onSelectOption}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      </ChatSidebar>
    </>
  );
}
