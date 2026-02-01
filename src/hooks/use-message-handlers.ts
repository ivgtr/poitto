"use client";

import { useCallback } from "react";
import { Task } from "@/types/task";
import { TaskInfo, getNextMissingField } from "@/domain/task/task-fields";
import { ParseResult, toTaskInfo } from "@/types/chat";
import { taskService } from "@/services/task-service";
import {
  mapSelectionToField,
  generateNextQuestion,
  canRegisterTask,
} from "@/services/task-conversation-service";
import { LlmConfig } from "@/lib/local-storage";
import { toast } from "sonner";

interface MessageHandlerProps {
  userId: string;
  conversation: {
    currentField: string | null;
    currentTaskInfo: Partial<TaskInfo>;
  };
  isFirstInput: boolean;
  pendingTaskInfo: React.MutableRefObject<TaskInfo | null>;
  onTaskCreated: (task: Task) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (data: {
    content: string;
    type: "question" | "confirmation" | "complete" | "cancelled" | "initial";
    taskInfo?: TaskInfo;
    options?: string[];
    isComplete?: boolean;
  }) => void;
  addSystemMessage: (content: string, type: "initial" | "cancelled") => void;
  processInput: (input: string, config: LlmConfig) => Promise<{
    result: ParseResult | null;
    isComplete: boolean;
  }>;
  updateField: (field: keyof TaskInfo, value: TaskInfo[keyof TaskInfo]) => void;
  setCurrentField: (field: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFirstInput: (value: boolean) => void;
  reset: () => void;
}

export function useMessageHandlers({
  userId,
  conversation,
  isFirstInput,
  pendingTaskInfo,
  onTaskCreated,
  addUserMessage,
  addAssistantMessage,
  addSystemMessage,
  processInput,
  updateField,
  setCurrentField,
  setIsLoading,
  setIsFirstInput,
  reset,
}: MessageHandlerProps) {
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
          type: "question",
          taskInfo: toTaskInfo(updatedTaskInfo),
          options: [...options],
        });
      } else {
        // すべてのフィールドが埋まった場合は確認画面へ
        addAssistantMessage({
          content: "以下のタスクを登録しますか？",
          type: "confirmation",
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

  type RegisterResult =
    | { type: "registered"; task: Task }
    | { type: "error" };

  const registerTask = useCallback(
    async (
      taskInfo: TaskInfo,
      validate?: () => boolean
    ): Promise<RegisterResult> => {
      if (validate && !validate()) {
        return { type: "error" };
      }

      try {
        const newTask = await taskService.create(taskInfo, userId);

        onTaskCreated(newTask);

        addAssistantMessage({
          content: "タスクを登録しました！",
          type: "complete",
          taskInfo,
          isComplete: true,
        });

        reset();
        toast.success("タスクを追加しました");
        return { type: "registered", task: newTask };
      } catch (err) {
        console.error("[TaskRegistration] Error:", err);
        toast.error("タスクの登録に失敗しました");
        return { type: "error" };
      }
    },
    [addAssistantMessage, onTaskCreated, reset, userId]
  );

  // フィールド選択処理（handleSelectOptionから分離）
  const handleFieldSelection = useCallback(
    (mapping: ReturnType<typeof mapSelectionToField>) => {
      // フィールドを更新（存在する場合）
      if (mapping.field) {
        updateField(mapping.field, mapping.value);
      }

      // 更新後のタスク情報をローカルで計算（state更新前に使用）
      const updatedTaskInfo = {
        ...conversation.currentTaskInfo,
        ...(mapping.field && { [mapping.field]: mapping.value }),
      };

      // 次の質問を生成（更新後の情報を使用）
      const { field, question, options } = generateNextQuestion(
        updatedTaskInfo,
        false
      );

      // 次のフィールドを設定
      const nextField = getNextMissingField(updatedTaskInfo, false);
      setCurrentField(nextField);

      if (field) {
        addAssistantMessage({
          content: question,
          type: "question",
          taskInfo: toTaskInfo(updatedTaskInfo),
          options: [...options],
        });
      } else {
        addAssistantMessage({
          content: "以下のタスクを登録しますか？",
          type: "confirmation",
          taskInfo: toTaskInfo(updatedTaskInfo),
          options: ["登録する", "登録しない"],
        });
      }

      return { type: "continue" as const };
    },
    [
      addAssistantMessage,
      conversation.currentTaskInfo,
      setCurrentField,
      updateField,
    ]
  );

  const handleSelectOption = useCallback(
    async (option: string) => {
      // キャンセル処理
      if (option === "登録しない") {
        addSystemMessage("タスクの登録をキャンセルしました。", "cancelled");
        return { type: "cancelled" as const };
      }

      const mapping = mapSelectionToField(
        option,
        conversation.currentField,
        conversation.currentTaskInfo
      );

      // とりあえず登録処理
      if (mapping.action === "register_anyway") {
        const taskInfoToRegister =
          pendingTaskInfo.current || toTaskInfo(conversation.currentTaskInfo);

        return registerTask(taskInfoToRegister, () => {
          if (!taskInfoToRegister.title || !taskInfoToRegister.category) {
            toast.error("タスクのタイトルとカテゴリが必要です");
            return false;
          }
          return true;
        });
      }

      // 通常登録処理
      if (option === "登録する") {
        const taskInfoToRegister =
          pendingTaskInfo.current || toTaskInfo(conversation.currentTaskInfo);

        return registerTask(taskInfoToRegister, () => {
          if (!canRegisterTask(taskInfoToRegister)) {
            toast.error("タスク情報が不完全です");
            return false;
          }
          return true;
        });
      }

      // 無効なマッピングの場合はメッセージとして送信
      if (!mapping.success) {
        return { type: "send_message" as const, message: option };
      }

      // フィールド更新と次の質問
      return handleFieldSelection(mapping);
    },
    [
      addSystemMessage,
      conversation.currentField,
      conversation.currentTaskInfo,
      handleFieldSelection,
      pendingTaskInfo,
      registerTask,
    ]
  );

  return {
    handleSendMessage,
    handleSelectOption,
  };
}
