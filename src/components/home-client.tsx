"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types/task";
import { Timeline } from "@/components/timeline";
import { Inbox } from "@/components/inbox";
import { toast } from "sonner";

// Components
import { Sidebar } from "./home/sidebar";
import { MobileNav } from "./home/mobile-nav";
import { ChatContainer } from "@/components/chat";

// Hooks - SOLID原則に従って単一責務に分割
import { useTaskList } from "@/hooks/use-task-list";
import { useTaskCreation } from "@/hooks/use-task-creation";
import { handleTaskUpdate } from "@/services/task-service";

interface HomeClientProps {
  userId: string;
  userName?: string;
  initialTasks: Task[];
}

type ViewMode = "home" | "calendar" | "chat" | "done";

export function HomeClient({ userId, initialTasks }: HomeClientProps) {
  // UI State - View Navigation
  const [activeView, setActiveView] = useState<ViewMode>("home");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Single Responsibility Hooks
  const { tasks, completeTask, addTask, updateTask } = useTaskList({ initialTasks });

  const {
    isLoading,
    messages,
    sendMessage,
    selectOption,
    clearSession,
  } = useTaskCreation({
    userId,
    onTaskCreated: addTask,
  });

  const handleChatOpenChange = useCallback((open: boolean) => {
    setIsChatOpen(open);
  }, []);

  const handleNewChat = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const handleEditTask = useCallback(async (taskId: string, data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => {
    try {
      await handleTaskUpdate(taskId, data, updateTask);
      toast.success("タスクを更新しました");
    } catch {
      toast.error("タスクの更新に失敗しました");
    }
  }, [updateTask]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* PC Sidebar - Fixed */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content - Fixed height container */}
      <main className="flex-1 flex flex-col md:fixed md:top-0 md:right-0 md:left-64 md:bottom-0 md:h-screen overflow-hidden">
        {/* SP Header */}
        <header className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            poitto
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </header>

        {/* Content Area - Only this scrolls */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Inbox */}
            {tasks.filter((t) => t.status === "inbox").length > 0 && (
              <Inbox
                tasks={tasks}
                onComplete={completeTask}
                onSchedule={() => toast.info("スケジュール機能は準備中です")}
                onUpdate={handleEditTask}
              />
            )}

            {/* Timeline */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                今日のタイムライン
              </h2>
              <Timeline tasks={tasks} onComplete={completeTask} onUpdate={handleEditTask} />
            </div>
          </div>
        </div>
      </main>

      {/* Chat Container - PC only */}
      <ChatContainer
        isOpen={isChatOpen}
        onOpenChange={handleChatOpenChange}
        messages={messages}
        onSendMessage={sendMessage}
        onSelectOption={(option) => selectOption(option)}
        onCancel={() => {}}
        isLoading={isLoading}
        onNewChat={handleNewChat}
      />

      {/* Mobile Navigation */}
      <MobileNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
