import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ChatPageClient } from "./chat-page-client";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <ChatPageClient 
      userId={session.user.id} 
      userName={session.user.name || session.user.email || "ユーザー"}
    />
  );
}
