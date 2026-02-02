import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTasks } from "@/actions/tasks";
import { DoneClient } from "@/components/done-client";

export default async function DonePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const result = await getTasks(session.user.id, ["done"]);

  if (!result.success) {
    console.error("[Done] Failed to get tasks:", result.error);
  }

  const tasks = result.success && result.data ? result.data : [];

  return (
    <DoneClient
      userId={session.user.id}
      userName={session.user.name || session.user.email || "ユーザー"}
      initialTasks={tasks}
    />
  );
}
