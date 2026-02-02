"use client";

import { useRouter } from "next/navigation";
import { Home, Calendar, MessageSquare, CheckCircle } from "lucide-react";

type ViewMode = "home" | "calendar" | "chat" | "done";

interface MobileNavProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const navItems = [
  { id: "home" as ViewMode, icon: Home, label: "Home", path: "/" },
  { id: "calendar" as ViewMode, icon: Calendar, label: "Calendar", path: "/calendar" },
  { id: "chat" as ViewMode, icon: MessageSquare, label: "Chat", path: "/chat" },
  { id: "done" as ViewMode, icon: CheckCircle, label: "Done", path: "/done" },
];

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const router = useRouter();

  const handleNavClick = (view: ViewMode) => {
    const target = navItems.find((item) => item.id === view);
    if (!target) return;
    router.push(target.path);
    onViewChange(view);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 z-40">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
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
  );
}
