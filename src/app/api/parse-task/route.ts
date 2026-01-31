import { NextRequest, NextResponse } from "next/server";
import { parseTaskWithLLM } from "@/lib/llm-parser-simple";
import { LlmConfig } from "@/lib/local-storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, config, previousContext, currentTaskInfo } = body;

    console.log("[API] Received:", { input, config: config?.provider });

    if (!input || !config) {
      return NextResponse.json(
        { error: "Missing input or config" },
        { status: 400 }
      );
    }

    const result = await parseTaskWithLLM(
      input,
      config as LlmConfig,
      previousContext || "",
      currentTaskInfo || {}
    );

    console.log("[API] Result:", JSON.stringify(result, null, 2));

    // UTF-8明示的に設定
    return new NextResponse(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Parse failed", details: String(error) },
      { status: 500 }
    );
  }
}
