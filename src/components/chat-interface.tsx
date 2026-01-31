"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaskInfo } from "@/domain/task/task-fields";
import { categoryConfig, formatDuration } from "@/lib/task-utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "initial" | "question" | "confirmation" | "complete" | "cancelled";
  taskInfo?: TaskInfo;
  options?: string[];
  isComplete?: boolean;
}

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
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="flex flex-col h-full">
      {/* メッセージ履歴 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg font-medium mb-2">タスクを追加</p>
            <p className="text-sm">自然言語でタスクを入力してください</p>
            <p className="text-sm mt-1 text-gray-300">例：「明日までに〇〇への返信」</p>
          </div>
        )}
        
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {/* ユーザー入力 */}
              {message.role === "user" && (
                <p>{message.content}</p>
              )}
              
              {/* アシスタントのメッセージ */}
              {message.role === "assistant" && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  {/* タスク情報サマリー */}
                  {message.taskInfo && (
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">
                          {message.taskInfo.category && categoryConfig[message.taskInfo.category as keyof typeof categoryConfig]?.icon || "📝"}
                        </span>
                        <span className="font-medium text-gray-900">
                          {message.taskInfo.title || "（タイトル未定）"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        {message.taskInfo.category && (
                          <p>カテゴリ: {categoryConfig[message.taskInfo.category as keyof typeof categoryConfig]?.label || message.taskInfo.category}</p>
                        )}
                        {message.taskInfo.deadline && (
                          <p>期限: {new Date(message.taskInfo.deadline).toLocaleDateString("ja-JP")}</p>
                        )}
                        {message.taskInfo.scheduledAt && (
                          <p>予定: {new Date(message.taskInfo.scheduledAt).toLocaleString("ja-JP")}</p>
                        )}
                        {message.taskInfo.durationMinutes && (
                          <p>所要時間: {formatDuration(message.taskInfo.durationMinutes)}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 選択肢ボタン - 重複を排除 */}
                  {message.options && message.options.length > 0 && !message.isComplete && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {[...new Set(message.options)].map((option, index) => {
                        const isConfirmation = message.type === "confirmation";
                        const isRegister = option === "登録する";
                        const isCancel = option === "登録しない";
                        
                        let variant: "default" | "secondary" | "outline" | "ghost" = "secondary";
                        if (isCancel) variant = "outline";
                        else if (isRegister && isConfirmation) variant = "default";
                        else if (option === "スキップ") variant = "ghost";
                        
                        return (
                          <Button
                            key={`${message.id}-${option}-${index}`}
                            size="sm"
                            variant={variant}
                            onClick={() => {
                              if (isCancel) {
                                onCancel(message.id);
                              } else {
                                onSelectOption(option, message.id);
                              }
                            }}
                            className={`text-xs ${
                              isCancel 
                                ? "border-red-300 text-red-600 hover:bg-red-50" 
                                : isRegister && isConfirmation
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                                : ""
                            }`}
                          >
                            {option}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* 完了/キャンセルメッセージ */}
                  {message.type === "complete" && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      タスクを登録しました
                    </p>
                  )}
                  {message.type === "cancelled" && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <X className="h-4 w-4" />
                      登録をキャンセルしました
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
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

      {/* 入力エリア */}
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
    </div>
  );
}
