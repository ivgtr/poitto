"use client";

import { useCallback } from "react";
import { Task } from "@/types/task";
import { TaskInfo, getNextMissingField } from "@/domain/task/task-fields";
import { toTaskInfo } from "@/types/chat";
import { taskService } from "@/services/task-service";
import {
  mapSelectionToField,
  generateNextQuestion,
  canRegisterTask,
} from "@/services/task-conversation-service";
import { toast } from "sonner";
import { MessageHandlerProps, MessageType, RegisterResult, SelectOptionResult } from "./types";

interface UseTaskRegistrationDeps {
  userId: MessageHandlerProps["userId"];
  addAssistantMessage: MessageHandlerProps["addAssistantMessage"];
  addSystemMessage: MessageHandlerProps["addSystemMessage"];
  updateField: MessageHandlerProps["updateField"];
  setCurrentField: MessageHandlerProps["setCurrentField"];
  reset: MessageHandlerProps["reset"];
  onTaskCreated: MessageHandlerProps["onTaskCreated"];
  pendingTaskInfo: MessageHandlerProps["pendingTaskInfo"];
  conversation: MessageHandlerProps["conversation"];
}

export function useTaskRegistration(deps: UseTaskRegistrationDeps) {
  const {
    userId,
    addAssistantMessage,
    addSystemMessage,
    updateField,
    setCurrentField,
    reset,
    onTaskCreated,
    pendingTaskInfo,
    conversation,
  } = deps;

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
          type: "complete" as MessageType,
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

  // フィールド選択処理
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
          type: "question" as MessageType,
          taskInfo: toTaskInfo(updatedTaskInfo),
          options: [...options],
        });
      } else {
        addAssistantMessage({
          content: "以下のタスクを登録しますか？",
          type: "confirmation" as MessageType,
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
    async (option: string): Promise<SelectOptionResult> => {
      // キャンセル処理
      if (option === "登録しない") {
        addSystemMessage("タスクの登録をキャンセルしました。", "cancelled");
        return { type: "cancelled" };
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
        return { type: "send_message", message: option };
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
    registerTask,
    handleSelectOption,
  };
}
