export type Category = "shopping" | "reply" | "work" | "personal" | "other";
export type TaskStatus = "inbox" | "scheduled" | "done" | "archived";

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: Category;
  deadline: Date | null;
  scheduledAt: Date | null;
  durationMinutes: number | null;
  status: TaskStatus;
  completedAt: Date | null;
  rawInput: string | null;
  createdAt: Date;
  updatedAt: Date;
}
