"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types/task";
import { Timeline } from "@/components/timeline";
import { Inbox } from "@/components/inbox";
import { toast } from "sonner";

// Components
import { Sidebar } from "./home/sidebar";
import { MobileNav } from "./home/mobile-nav";
import { ChatFab } from "./home/chat-fab";

// Hooks - SOLID原則に従って単一責務に分割
import { useTaskList } from "@/hooks/use-task-list";
import { useTaskCreation } from "@/hooks/use-task-creation";

interface HomeClientProps {
  userId: string;
  userName: string;
  initialTasks: Task[];
}

type ViewMode = "home" | "calendar" | "chat" | "done";

export function HomeClient({ userId, userName, initialTasks }: HomeClientProps) {
  // UI State - View Navigation
  const [activeView, setActiveView] = useState<ViewMode>("home");

  // Single Responsibility Hooks
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { tasks, completeTask, addTask } = useTaskList({ initialTasks });

  const {
    isLoading,
    messages,
    conversation,
    sendMessage,
    selectOption,
    cancelCreation,
    reset: resetTaskCreation,
  } = useTaskCreation({
    userId,
    onTaskCreated: addTask,
    onCancel: () => setIsChatOpen(false),
  });

  // Handle sheet open/close with cleanup
  const handleSheetOpenChange = useCallback((open: boolean) => {
    setIsChatOpen(open);
    if (!open) {
      resetTaskCreation();
    }
  }, [resetTaskCreation]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* PC Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 relative">
        {/* SP Header */}
        <header className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            poitto
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Inbox */}
            {tasks.filter((t) => t.status === "inbox").length > 0 && (
              <Inbox
                tasks={tasks}
                onComplete={completeTask}
                onSchedule={(id) => toast.info("スケジュール機能は準備中です")}
              />
            )}

            {/* Timeline */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                今日のタイムライン
              </h2>
              <Timeline tasks={tasks} onComplete={completeTask} />
            </div>
          </div>
        </div>
      </main>

      {/* Chat FAB */}
      <ChatFab
        isOpen={isChatOpen}
        onOpenChange={handleSheetOpenChange}
        messages={messages}
        onSendMessage={sendMessage}
        onSelectOption={selectOption}
        onCancel={cancelCreation}
        isLoading={isLoading}
      />

      {/* Mobile Navigation */}
      <MobileNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
