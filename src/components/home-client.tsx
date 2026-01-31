"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";
import { Timeline } from "@/components/timeline";
import { Inbox } from "@/components/inbox";
import { toast } from "sonner";
import { Home, Calendar, MessageSquare, CheckCircle, LogOut, X, MessageCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatInterface } from "@/components/chat-interface";

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
import { TaskInfo } from "@/lib/task-fields";

interface HomeClientProps {
  userId: string;
  userName: string;
  initialTasks: Task[];
}

type ViewMode = "home" | "calendar" | "chat" | "done";

export function HomeClient({ userId, userName, initialTasks }: HomeClientProps) {
  const router = useRouter();

  // UI状態
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeView, setActiveView] = useState<ViewMode>("home");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstInput, setIsFirstInput] = useState(true); // 初回入力かどうか

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

    // ユーザーメッセージを追加
    addUserMessage(message);
    setIsLoading(true);

    try {
      // 入力を解析してアクションを決定
      const { result, nextField, isComplete } = await processInput(message, config);

      // APIから返されたtaskInfoをそのまま使用（フォールバック処理は削除）
      const updatedTaskInfo = result?.taskInfo || conversation.currentTaskInfo;

      console.log("[Client] API TaskInfo:", updatedTaskInfo);
      console.log("[Client] isComplete:", isComplete, "Next Field:", nextField);

      // 必須項目が揃ったかチェック
      if (isComplete) {
        // Refに最新のタスク情報を保存
        pendingTaskInfoRef.current = updatedTaskInfo as TaskInfo;
        
        if (isFirstInput) {
          // 初回入力で必須項目が揃った - 任意項目を確認する
          setIsFirstInput(false);
          const { field, question, options } = generateNextQuestion(
            updatedTaskInfo,
            false // 初回ではない（任意項目も確認）
          );
          
          if (field) {
            // 任意項目が残っている場合は尋ねる
            const messageData = {
              content: question,
              type: "question" as const,
              taskInfo: updatedTaskInfo as TaskInfo,
              options: [...options, "スキップ"],
            };
            console.log("[Client] Asking optional field:", field, messageData);
            addAssistantMessage(messageData);
          } else {
            // すべての項目が揃っている - 登録確認
            const messageData = {
              content: "以下のタスクを登録しますか？",
              type: "confirmation" as const,
              taskInfo: updatedTaskInfo as TaskInfo,
              options: ["登録する", "登録しない"],
            };
            console.log("[Client] Adding Confirmation Message:", messageData);
            addAssistantMessage(messageData);
          }
        } else {
          // 2回目以降で必須項目が揃っている - 登録確認
          const messageData = {
            content: "以下のタスクを登録しますか？",
            type: "confirmation" as const,
            taskInfo: updatedTaskInfo as TaskInfo,
            options: ["登録する", "登録しない"],
          };
          console.log("[Client] Adding Confirmation Message:", messageData);
          addAssistantMessage(messageData);
        }
      } else {
        // 必須項目が欠けている - 継続して尋ねる
        const { question, options } = generateNextQuestion(
          updatedTaskInfo,
          true // 初回（必須項目のみ確認）
        );

        const messageData = {
          content: question,
          type: "question" as const,
          taskInfo: updatedTaskInfo as TaskInfo,
          options: [...options],
        };
        console.log("[Client] Adding Question Message:", messageData);
        addAssistantMessage(messageData);
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
    // 「登録しない」が選ばれた場合
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
      // マッピングに失敗した場合はLLMで解析（フォールバック）
      handleSendMessage(option);
      return;
    }

    // 「登録する」が選ばれた場合
    if (option === "登録する") {
      // Refから最新のタスク情報を取得（State更新の非同期問題を回避）
      const taskInfoToRegister = pendingTaskInfoRef.current || conversation.currentTaskInfo as TaskInfo;
      
      console.log("[Register] taskInfoToRegister:", taskInfoToRegister);
      console.log("[Register] pendingTaskInfoRef.current:", pendingTaskInfoRef.current);
      console.log("[Register] conversation.currentTaskInfo:", conversation.currentTaskInfo);
      console.log("[Register] typeof title:", typeof taskInfoToRegister.title, "title value:", JSON.stringify(taskInfoToRegister.title));
      console.log("[Register] typeof category:", typeof taskInfoToRegister.category, "category value:", JSON.stringify(taskInfoToRegister.category));
      
      const canRegister = canRegisterTask(taskInfoToRegister);
      console.log("[Register] canRegisterTask result:", canRegister);
      
      if (!canRegister) {
        console.log("[Register] Validation failed. Title:", taskInfoToRegister.title, "Category:", taskInfoToRegister.category);
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
        pendingTaskInfoRef.current = null; // 登録後はクリア
        toast.success("タスクを追加しました");
      } catch (error) {
        toast.error("タスクの登録に失敗しました");
      }
      return;
    }

    // 「スキップ」またはその他の選択肢
    if (mapping.field) {
      updateField(mapping.field, mapping.value);
    }

    // 次のステップを決定
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
      // すべての項目が揃っている場合は登録確認へ
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

  const navItems = [
    { id: "home" as ViewMode, icon: Home, label: "Home" },
    { id: "calendar" as ViewMode, icon: Calendar, label: "Calendar" },
    { id: "chat" as ViewMode, icon: MessageSquare, label: "Chat" },
    { id: "done" as ViewMode, icon: CheckCircle, label: "Done" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* PC用サイドバー */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            poitto
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`
                flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left
                transition-colors
                ${activeView === item.id
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <nav className="space-y-1 mb-4">
            <button
              onClick={() => router.push("/settings")}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">設定</span>
            </button>
          </nav>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </aside>

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
      <div className="hidden md:block fixed bottom-8 right-8 z-50">
        <Sheet open={isChatOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                {isChatOpen ? (
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
                  onSendMessage={handleSendMessage}
                  onSelectOption={handleSelectOption}
                  onCancel={handleCancel}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* SP用ホバーメニュー */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 z-40">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-xl
                transition-colors
                ${activeView === item.id
                  ? "text-violet-600"
                  : "text-gray-400"
                }
              `}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
