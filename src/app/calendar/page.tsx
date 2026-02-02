import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTasks } from "@/actions/tasks";
import { CalendarClient } from "@/components/calendar/calendar-client";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const result = await getTasks(session.user.id, ["scheduled", "done"]);

  if (!result.success) {
    console.error("[Calendar] Failed to get tasks:", result.error);
  }

  const tasks = result.success && result.data ? result.data : [];

  return (
    <CalendarClient
      userId={session.user.id}
      userName={session.user.name || session.user.email || "ユーザー"}
      initialTasks={tasks}
    />
  );
}
