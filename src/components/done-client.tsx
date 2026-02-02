"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ChatContainer } from "@/components/chat";
import { MobileNav } from "@/components/home/mobile-nav";
import { Sidebar } from "@/components/home/sidebar";
import { useTaskCreation } from "@/hooks/use-task-creation";
import { useTaskList } from "@/hooks/use-task-list";
import { categoryConfig } from "@/lib/task-utils";
import { Task } from "@/types/task";

type ViewMode = "home" | "calendar" | "chat" | "done";

interface DoneClientProps {
  userId: string;
  userName?: string;
  initialTasks: Task[];
}

export function DoneClient({ userId, initialTasks }: DoneClientProps) {
  const [activeView, setActiveView] = useState<ViewMode>("done");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { tasks, addTask } = useTaskList({ initialTasks });

  const {
    isLoading,
    messages,
    sendMessage,
    selectOption,
    clearSession,
  } = useTaskCreation({
    userId,
    onTaskCreated: (task) => {
      addTask(task);
      toast.success("タスクを追加しました");
    },
  });

  const handleChatOpenChange = useCallback((open: boolean) => {
    setIsChatOpen(open);
  }, []);

  const handleNewChat = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const doneTasks = tasks
    .filter((task) => task.status === "done")
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 flex flex-col md:fixed md:top-0 md:right-0 md:left-64 md:bottom-0 md:h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            poitto
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">完了タスク</h2>
            {doneTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-8 text-center text-sm text-gray-500">
                完了タスクはまだありません
              </div>
            ) : (
              <div className="space-y-3">
                {doneTasks.map((task) => {
                  const config = categoryConfig[task.category];
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${config.bgColor} border border-gray-200/50`}
                    >
                      <span className="text-xl">{config.icon}</span>
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${config.color}`}>{task.title}</p>
                        {task.completedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(task.completedAt).toLocaleDateString("ja-JP")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

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

      <MobileNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
