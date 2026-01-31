"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Github, Chrome } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch (error) {
      toast.error("ログインに失敗しました");
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            poitto
          </CardTitle>
          <CardDescription>
            以下のアカウントでログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleSignIn("github")}
            className="w-full bg-[#24292e] hover:bg-[#1b1f23] text-white"
            disabled={isLoading !== null}
          >
            {isLoading === "github" ? (
              "ログイン中..."
            ) : (
              <>
                <Github className="mr-2 h-5 w-5" />
                GitHubでログイン
              </>
            )}
          </Button>
          <Button
            onClick={() => handleSignIn("google")}
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50"
            disabled={isLoading !== null}
          >
            {isLoading === "google" ? (
              "ログイン中..."
            ) : (
              <>
                <Chrome className="mr-2 h-5 w-5 text-blue-500" />
                Googleでログイン
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
