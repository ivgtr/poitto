"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { categoryConfig, formatDuration } from "@/lib/task-utils";
import { Category } from "@/types/task";
import { ChatMessage } from "./chat-types";

// 型ガード: 文字列が有効なCategoryかどうかをチェック
function isValidCategory(category: string | null | undefined): category is Category {
  if (!category) return false;
  return ["shopping", "reply", "work", "personal", "other"].includes(category);
}

interface ChatMessageItemProps {
  message: ChatMessage;
  onSelectOption: (option: string, messageId: string) => void;
  onCancel: (messageId: string) => void;
}

export function ChatMessageItem({
  message,
  onSelectOption,
  onCancel,
}: ChatMessageItemProps) {
  return (
    <motion.div
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
        {message.role === "user" && <p>{message.content}</p>}

        {/* アシスタントのメッセージ */}
        {message.role === "assistant" && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{message.content}</p>

            {/* タスク情報サマリー */}
            {message.taskInfo && (
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {(isValidCategory(message.taskInfo.category) &&
                      categoryConfig[message.taskInfo.category]?.icon) ||
                      "📝"}
                  </span>
                  <span className="font-medium text-gray-900">
                    {message.taskInfo.title || "（タイトル未定）"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {isValidCategory(message.taskInfo.category) && (
                    <p>
                      カテゴリ:{" "}
                      {categoryConfig[message.taskInfo.category]?.label || message.taskInfo.category}
                    </p>
                  )}
                  {message.taskInfo.deadline && (
                    <p>
                      期限:{" "}
                      {new Date(
                        message.taskInfo.deadline
                      ).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                  {message.taskInfo.scheduledDate && (
                    <p>
                      予定:{" "}
                      {new Date(
                        message.taskInfo.scheduledDate + (message.taskInfo.scheduledTime ? `T${message.taskInfo.scheduledTime}:00` : "T00:00:00")
                      ).toLocaleDateString("ja-JP")}
                      {message.taskInfo.scheduledTime && ` ${message.taskInfo.scheduledTime}`}
                    </p>
                  )}
                  {message.taskInfo.durationMinutes && (
                    <p>
                      所要時間:{" "}
                      {formatDuration(message.taskInfo.durationMinutes)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 選択肢ボタン - 重複を排除 */}
            {message.options &&
              message.options.length > 0 &&
              !message.isComplete && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {[...new Set(message.options)].map((option, index) => {
                    const isConfirmation = message.type === "confirmation";
                    const isRegister = option === "登録する";
                    const isCancel = option === "登録しない";

                    let variant: "default" | "secondary" | "outline" | "ghost" =
                      "secondary";
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
  );
}
