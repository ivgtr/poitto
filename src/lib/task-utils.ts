import { Category } from "@/types/task";

export const categoryConfig: Record<Category, { label: string; color: string; bgColor: string; icon: string }> = {
  shopping: {
    label: "買い物",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    icon: "🛒",
  },
  reply: {
    label: "返信",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: "📧",
  },
  work: {
    label: "仕事",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: "💼",
  },
  personal: {
    label: "個人",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: "🏠",
  },
  other: {
    label: "その他",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: "📋",
  },
};

export function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
}

export function formatTime(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getBubbleSize(durationMinutes: number | null): string {
  if (!durationMinutes) return "h-16";
  if (durationMinutes <= 15) return "h-12";
  if (durationMinutes <= 30) return "h-16";
  if (durationMinutes <= 60) return "h-20";
  return "h-24";
}
