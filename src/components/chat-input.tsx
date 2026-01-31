"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;
    onSubmit(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="
        flex items-end gap-2 rounded-2xl border bg-white p-3 shadow-lg
        focus-within:ring-2 focus-within:ring-violet-500/20
      "
    >
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="タスクを入力...（例：明日までに〇〇への返信）"
        className="
          min-h-[44px] resize-none border-0 bg-transparent
          focus-visible:ring-0 focus-visible:ring-offset-0
        "
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || isLoading}
        size="icon"
        className="
          shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600
          hover:from-violet-700 hover:to-indigo-700
          disabled:opacity-50
        "
      >
        <Send className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
