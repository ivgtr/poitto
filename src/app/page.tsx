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

  const tasks = await getTasks(session.user.id);

  return (
    <HomeClient
      userId={session.user.id}
      userName={session.user.name || session.user.email || "ユーザー"}
      initialTasks={tasks}
    />
  );
}
