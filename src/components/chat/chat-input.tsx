"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="メッセージを入力..."
          className="min-h-[44px] max-h-[120px] resize-none"
          rows={1}
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        選択肢を選ぶか、自由に入力してください
      </p>
    </div>
  );
}
