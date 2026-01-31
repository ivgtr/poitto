"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatInterface } from "@/components/chat-interface";
import { ChatMessage } from "@/components/chat-interface";

interface ChatSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSelectOption: (option: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  trigger: React.ReactNode;
}

export function ChatSheet({
  isOpen,
  onOpenChange,
  messages,
  onSendMessage,
  onSelectOption,
  onCancel,
  isLoading,
  trigger,
}: ChatSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>

      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-violet-600" />
              タスクを追加
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={messages}
              onSendMessage={onSendMessage}
              onSelectOption={onSelectOption}
              onCancel={onCancel}
              isLoading={isLoading}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ChatFabButtonProps {
  isOpen: boolean;
  onClick?: () => void;
}

function ChatFabButton({ isOpen, onClick }: ChatFabButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="
        w-16 h-16 rounded-full
        bg-gradient-to-r from-violet-600 to-indigo-600
        hover:from-violet-700 hover:to-indigo-700
        text-white shadow-lg shadow-violet-500/30
        flex items-center justify-center
        transition-all duration-200
        hover:shadow-xl hover:shadow-violet-500/40
      "
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-7 w-7" />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageCircle className="h-7 w-7" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface ChatFabProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSelectOption: (option: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ChatFab({
  isOpen,
  onOpenChange,
  messages,
  onSendMessage,
  onSelectOption,
  onCancel,
  isLoading,
}: ChatFabProps) {
  return (
    <div className="hidden md:block fixed bottom-8 right-8 z-50">
      <ChatSheet
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        messages={messages}
        onSendMessage={onSendMessage}
        onSelectOption={onSelectOption}
        onCancel={onCancel}
        isLoading={isLoading}
        trigger={<ChatFabButton isOpen={isOpen} />}
      />
    </div>
  );
}
