"use client";

import { Home, Calendar, MessageSquare, CheckCircle, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type ViewMode = "home" | "calendar" | "chat" | "done";

interface SidebarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const navItems = [
  { id: "home" as ViewMode, icon: Home, label: "Home" },
  { id: "calendar" as ViewMode, icon: Calendar, label: "Calendar" },
  { id: "chat" as ViewMode, icon: MessageSquare, label: "Chat" },
  { id: "done" as ViewMode, icon: CheckCircle, label: "Done" },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className="hidden md:flex md:fixed md:top-0 md:left-0 md:h-screen w-64 flex-col border-r bg-white z-30 overflow-hidden touch-none">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          poitto
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
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
  );
}
