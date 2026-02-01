"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import { MobileNav } from "@/components/home/mobile-nav";
import { useTaskList } from "@/hooks/use-task-list";
import { useTaskCreation } from "@/hooks/use-task-creation";
import { toast } from "sonner";

interface ChatPageClientProps {
  userId: string;
  userName: string;
}

export function ChatPageClient({ userId }: ChatPageClientProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"home" | "calendar" | "chat" | "done">("chat");

  const { addTask } = useTaskList({ initialTasks: [] });

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

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">タスクを追加</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSession}
          className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
        >
          新規チャット
        </Button>
      </header>

      {/* Chat Interface - Full Screen */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            onSelectOption={(option) => selectOption(option)}
            onCancel={() => {}}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
