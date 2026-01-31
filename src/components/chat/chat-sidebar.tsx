"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "@/components/chat-interface";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  isOpen: boolean;
  viewMode: "sidebar" | "floating";
  onViewModeChange: (mode: "sidebar" | "floating") => void;
  onNewChat: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function ChatSidebar({
  isOpen,
  viewMode,
  onViewModeChange,
  onNewChat,
  onClose,
  children,
}: ChatSidebarProps) {
  const isFloating = viewMode === "floating";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "hidden md:flex flex-col bg-white",
              isFloating
                ? "fixed bottom-5 right-5 z-50 w-[450px] h-[70vh] max-h-[600px] border border-gray-200 rounded-2xl shadow-2xl"
                : "fixed top-0 right-0 z-40 w-[450px] h-screen border-l border-gray-200 shadow-xl"
            )}
          >
            <ChatHeader
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              onNewChat={onNewChat}
              onClose={onClose}
            />
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
