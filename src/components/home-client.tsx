"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ChatContainer } from "@/components/chat";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { MobileNav } from "@/components/home/mobile-nav";
import { Sidebar } from "@/components/home/sidebar";
import { useTaskCreation } from "@/hooks/use-task-creation";
import { useTaskStore } from "@/stores/task-store";
import { normalizeCategory } from "@/lib/task-utils";
import { Task } from "@/types/task";

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

  // Zustand Store
  const { initializeTasks, updateTask, completeTask, tasks } = useTaskStore();
  
  // Initialize store with server data
  useEffect(() => {
    initializeTasks(initialTasks);
  }, [initialTasks, initializeTasks]);
  
  // Get active tasks from store (inbox + scheduled)
  // Filter inside component to avoid server/client mismatch
  const activeTasks = useMemo(() => 
    tasks.filter((t) => t.status === "inbox" || t.status === "scheduled"),
    [tasks]
  );

  const {
    isLoading,
    messages,
    sendMessage,
    selectOption,
    clearSession,
  } = useTaskCreation({
    userId,
    onTaskCreated: () => {
      // Task creation now handled by sidebar/store
      // This callback kept for chat compatibility
    },
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
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => {
    await updateTask(taskId, {
      title: data.title,
      category: normalizeCategory(data.category),
      deadline: data.deadline,
      scheduledDate: data.scheduledDate,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes,
    });
  }, [updateTask]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* PC Sidebar - Fixed */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} userId={userId} />

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
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                期限別ボード
              </h2>
              <KanbanBoard
                tasks={activeTasks}
                onUpdate={handleEditTask}
                onComplete={completeTask}
              />
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
