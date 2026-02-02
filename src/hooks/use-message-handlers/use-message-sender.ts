"use client";

import { useCallback } from "react";
import { toTaskInfo } from "@/types/chat";
import { generateNextQuestion } from "@/services/task-conversation-service";
import { toast } from "sonner";
import { MessageHandlerProps, MessageType } from "./types";
import { LlmConfig } from "@/lib/local-storage";

interface UseMessageSenderDeps {
  addUserMessage: MessageHandlerProps["addUserMessage"];
  addAssistantMessage: MessageHandlerProps["addAssistantMessage"];
  addSystemMessage: MessageHandlerProps["addSystemMessage"];
  processInput: MessageHandlerProps["processInput"];
  setIsLoading: MessageHandlerProps["setIsLoading"];
  setIsFirstInput: MessageHandlerProps["setIsFirstInput"];
  setCurrentField: MessageHandlerProps["setCurrentField"];
  pendingTaskInfo: MessageHandlerProps["pendingTaskInfo"];
  conversation: MessageHandlerProps["conversation"];
  isFirstInput: boolean;
}

export function useMessageSender(deps: UseMessageSenderDeps) {
  const {
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    processInput,
    setIsLoading,
    setIsFirstInput,
    setCurrentField,
    pendingTaskInfo,
    conversation,
    isFirstInput,
  } = deps;

  const handleSendMessage = useCallback(async (message: string, config: LlmConfig) => {
    addUserMessage(message);
    setIsLoading(true);

    try {
      const { result } = await processInput(message, config);
      const updatedTaskInfo = result?.taskInfo || conversation.currentTaskInfo;

      // 初回入力時はフラグを更新
      if (isFirstInput) {
        setIsFirstInput(false);
      }

      // 解析結果を保存（LLM結果を信頼）
      pendingTaskInfo.current = updatedTaskInfo ? toTaskInfo(updatedTaskInfo) : null;

      // 次の空いているフィールドを尋ねる（すべて埋まるまで続ける）
      const { field, question, options } = generateNextQuestion(
        updatedTaskInfo,
        false
      );
      
      if (field) {
        // まだ埋めていないフィールドがある場合は質問を続ける
        setCurrentField(field);
        addAssistantMessage({
          content: question,
          type: "question" as MessageType,
          taskInfo: toTaskInfo(updatedTaskInfo),
          options: [...options],
        });
      } else {
        // すべてのフィールドが埋まった場合は確認画面へ
        addAssistantMessage({
          content: "以下のタスクを登録しますか？",
          type: "confirmation" as MessageType,
          taskInfo: updatedTaskInfo ? toTaskInfo(updatedTaskInfo) : toTaskInfo(conversation.currentTaskInfo),
          options: ["登録する", "登録しない"],
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("タスクの解析に失敗しました");
      addSystemMessage(
        "申し訳ありません。解析に失敗しました。もう一度入力してください。",
        "initial"
      );
    } finally {
      setIsLoading(false);
    }
  }, [addUserMessage, addAssistantMessage, addSystemMessage, conversation.currentTaskInfo, isFirstInput, pendingTaskInfo, processInput, setCurrentField, setIsFirstInput, setIsLoading]);

  return { handleSendMessage };
}
