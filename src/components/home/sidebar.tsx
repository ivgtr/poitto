"use client";

import { useState, useEffect } from "react";
import { Home, Calendar, MessageSquare, CheckCircle, LogOut, Settings, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { TaskCreateDialog } from "@/components/task/task-create-dialog";
import { useTaskStore } from "@/stores/task-store";

type ViewMode = "home" | "calendar" | "chat" | "done";

interface SidebarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  userId: string;
}

const navItems = [
  { id: "home" as ViewMode, icon: Home, label: "Home", path: "/" },
  { id: "calendar" as ViewMode, icon: Calendar, label: "Calendar", path: "/calendar" },
  { id: "chat" as ViewMode, icon: MessageSquare, label: "Chat", path: "/chat" },
  { id: "done" as ViewMode, icon: CheckCircle, label: "Done", path: "/done" },
];

export function Sidebar({ activeView, onViewChange, userId }: SidebarProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { createTask, fetchTasks } = useTaskStore();

  // フォーカス時にタスクリストを再取得（デバイス間同期）
  useEffect(() => {
    const handleFocus = () => {
      fetchTasks(userId, false); // キャッシュ戦略に従う（5分以内はスキップ）
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userId, fetchTasks]);

  const handleCreate = async (data: {
    title: string;
    category: string;
    deadline?: Date | null;
    scheduledDate?: string | null;
    scheduledAt?: Date | null;
    durationMinutes?: number | null;
  }) => {
    const result = await createTask(userId, data);
    if (result) {
      // タスク作成成功時にダイアログを閉じる
      // リストへの反映はストアの楽観的更新で自動的に行われる
      setIsCreateOpen(false);
    }
    // 失敗時はストア内でエラートースト表示、ダイアログは開いたまま
  };

  return (
    <aside className="hidden md:flex md:fixed md:top-0 md:left-0 md:h-screen w-64 flex-col border-r bg-white z-30 overflow-hidden touch-none">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          poitto
        </h1>
      </div>
      <div className="p-4 border-b">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">タスクを追加</span>
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              router.push(item.path);
              onViewChange(item.id);
            }}
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

      <TaskCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
      />
    </aside>
  );
}
