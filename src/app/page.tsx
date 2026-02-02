import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTasks } from "@/actions/tasks";
import { HomeClient } from "@/components/home-client";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const result = await getTasks(session.user.id, ["inbox", "scheduled"]);

  if (!result.success) {
    // エラー時は空配列を返す（エラー表示はクライアント側で）
    console.error("[Home] Failed to get tasks:", result.error);
  }

  const tasks = result.success && result.data ? result.data : [];

  return (
    <HomeClient
      userId={session.user.id}
      userName={session.user.name || session.user.email || "ユーザー"}
      initialTasks={tasks}
    />
  );
}
