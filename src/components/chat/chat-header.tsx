"use client";

import { Pencil, PanelRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  viewMode: "sidebar" | "floating";
  onViewModeChange: (mode: "sidebar" | "floating") => void;
  onNewChat: () => void;
  onClose: () => void;
  title?: string;
}

export function ChatHeader({
  viewMode,
  onViewModeChange,
  onNewChat,
  onClose,
  title = "タスクを追加",
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      
      <div className="flex items-center gap-1">
        {/* New Chat Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="h-8 w-8 text-gray-600 hover:text-violet-600 hover:bg-violet-50"
          title="新しいチャット"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* View Mode Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-600 hover:text-violet-600 hover:bg-violet-50"
              title="表示切替"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onViewModeChange("sidebar")}
              className={cn(
                "cursor-pointer",
                viewMode === "sidebar" && "bg-violet-50 text-violet-700"
              )}
            >
              <span className={cn("mr-2", viewMode === "sidebar" ? "opacity-100" : "opacity-0")}>
                ✓
              </span>
              サイドバー
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onViewModeChange("floating")}
              className={cn(
                "cursor-pointer",
                viewMode === "floating" && "bg-violet-50 text-violet-700"
              )}
            >
              <span className={cn("mr-2", viewMode === "floating" ? "opacity-100" : "opacity-0")}>
                ✓
              </span>
              フローティング
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
          title="閉じる"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
