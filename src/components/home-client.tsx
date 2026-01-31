"use client";

import { useState, useRef } from "react";
import { Task } from "@/types/task";
import { Timeline } from "@/components/timeline";
import { Inbox } from "@/components/inbox";
import { toast } from "sonner";


// 新しいコンポーネント
import { Sidebar } from "./home/sidebar";
import { MobileNav } from "./home/mobile-nav";
import { ChatFab } from "./home/chat-fab";

// カスタムフック
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useTaskConversation } from "@/hooks/use-task-conversation";

// サービス
import { taskService } from "@/services/task-service";
import {
  mapSelectionToField,
  generateNextQuestion,
  canRegisterTask,
} from "@/services/task-conversation-service";

// ユーティリティ
import { getLlmConfig } from "@/lib/local-storage";
import { TaskInfo } from "@/domain/task/task-fields";

interface HomeClientProps {
  userId: string;
  userName: string;
  initialTasks: Task[];
}

type ViewMode = "home" | "calendar" | "chat" | "done";

export function HomeClient({ userId, userName, initialTasks }: HomeClientProps) {
  // UI状態
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeView, setActiveView] = useState<ViewMode>("home");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstInput, setIsFirstInput] = useState(true);

  // 登録待ちのタスク情報を保持（State更新の非同期問題を回避）
  const pendingTaskInfoRef = useRef<TaskInfo | null>(null);

  // カスタムフック
  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    clearMessages,
  } = useChatMessages();
  const {
    state: conversation,
    isActive,
    updateField,
    processInput,
    reset: resetConversation,
  } = useTaskConversation();

  // シートを閉じた時にリセット
  const handleSheetOpenChange = (open: boolean) => {
    setIsChatOpen(open);
    if (!open) {
      resetConversation();
      clearMessages();
      setIsFirstInput(true);
      pendingTaskInfoRef.current = null;
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await taskService.complete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("タスクを完了しました");
    } catch (error) {
      toast.error("エラーが発生しました");
    }
  };

  const handleSendMessage = async (message: string) => {
    const config = getLlmConfig();

    if (!config) {
      toast.error("APIキーが設定されていません。設定画面でAPIキーを入力してください。");
      return;
    }

    addUserMessage(message);
    setIsLoading(true);

    try {
      const { result, isComplete } = await processInput(message, config);
      const updatedTaskInfo = result?.taskInfo || conversation.currentTaskInfo;

      if (isComplete) {
        pendingTaskInfoRef.current = updatedTaskInfo as TaskInfo;
        
        if (isFirstInput) {
          setIsFirstInput(false);
          const { field, question, options } = generateNextQuestion(
            updatedTaskInfo,
            false
          );
          
          if (field) {
            addAssistantMessage({
              content: question,
              type: "question" as const,
              taskInfo: updatedTaskInfo as TaskInfo,
              options: [...options, "スキップ"],
            });
          } else {
            addAssistantMessage({
              content: "以下のタスクを登録しますか？",
              type: "confirmation" as const,
              taskInfo: updatedTaskInfo as TaskInfo,
              options: ["登録する", "登録しない"],
            });
          }
        } else {
          addAssistantMessage({
            content: "以下のタスクを登録しますか？",
            type: "confirmation" as const,
            taskInfo: updatedTaskInfo as TaskInfo,
            options: ["登録する", "登録しない"],
          });
        }
      } else {
        const { question, options } = generateNextQuestion(
          updatedTaskInfo,
          true
        );

        addAssistantMessage({
          content: question,
          type: "question" as const,
          taskInfo: updatedTaskInfo as TaskInfo,
          options: [...options],
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
  };

  const handleSelectOption = async (option: string) => {
    if (option === "登録しない") {
      handleCancel();
      return;
    }

    const mapping = mapSelectionToField(
      option,
      conversation.currentField,
      conversation.currentTaskInfo
    );

    if (!mapping.success && option !== "登録する") {
      handleSendMessage(option);
      return;
    }

    if (option === "登録する") {
      const taskInfoToRegister = pendingTaskInfoRef.current || conversation.currentTaskInfo as TaskInfo;
      
      if (!canRegisterTask(taskInfoToRegister)) {
        toast.error("タスク情報が不完全です");
        return;
      }

      try {
        const newTask = await taskService.create(
          taskInfoToRegister,
          userId
        );
        setTasks((prev) => [newTask, ...prev]);

        addAssistantMessage({
          content: "タスクを登録しました！",
          type: "complete",
          taskInfo: taskInfoToRegister,
          isComplete: true,
        });

        resetConversation();
        clearMessages();
        pendingTaskInfoRef.current = null;
        toast.success("タスクを追加しました");
      } catch (error) {
        toast.error("タスクの登録に失敗しました");
      }
      return;
    }

    if (mapping.field) {
      updateField(mapping.field, mapping.value);
    }

    const { field, question, options } = generateNextQuestion({
      ...conversation.currentTaskInfo,
      [mapping.field || ""]: mapping.value,
    });

    if (field) {
      addAssistantMessage({
        content: question,
        type: "question",
        taskInfo: { ...conversation.currentTaskInfo, [mapping.field || ""]: mapping.value } as TaskInfo,
        options: [...options],
      });
    } else {
      addAssistantMessage({
        content: "以下のタスクを登録しますか？",
        type: "confirmation",
        taskInfo: conversation.currentTaskInfo as TaskInfo,
        options: ["登録する", "登録しない"],
      });
    }
  };

  const handleCancel = () => {
    addSystemMessage("タスクの登録をキャンセルしました。", "cancelled");
    resetConversation();
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* PC用サイドバー */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 relative">
        {/* SP用ヘッダー */}
        <header className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            poitto
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </header>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Inbox */}
            {tasks.filter((t) => t.status === "inbox").length > 0 && (
              <Inbox
                tasks={tasks}
                onComplete={handleComplete}
                onSchedule={(id) => toast.info("スケジュール機能は準備中です")}
              />
            )}

            {/* Timeline */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                今日のタイムライン
              </h2>
              <Timeline tasks={tasks} onComplete={handleComplete} />
            </div>
          </div>
        </div>
      </main>

      {/* PC用: フローティングチャットボタン (FAB) */}
      <ChatFab
        isOpen={isChatOpen}
        onOpenChange={handleSheetOpenChange}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSelectOption={handleSelectOption}
        onCancel={handleCancel}
        isLoading={isLoading}
        onOpen={() => setIsChatOpen(true)}
      />

      {/* SP用ホバーメニュー */}
      <MobileNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
