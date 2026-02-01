"use server";

import OpenAI from "openai";
import { LlmConfig } from "@/lib/local-storage";
import { ParseResult } from "@/domain/task/task-fields";
import { buildFirstInputPrompt } from "./prompt-first-input";
import { buildTaskInfoFromLlmResponse, buildParseResult } from "./result-builder";

/**
 * 初回入力をLLMでパース
 */
export async function parseFirstInput(
  input: string,
  config: LlmConfig
): Promise<ParseResult> {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    ...(config.provider === "openrouter" ? {
      baseURL: "https://openrouter.ai/api/v1",
    } : {})
  });

  const prompt = buildFirstInputPrompt(input);

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: "日本語タスク解析エキスパート" },
      { role: "user", content: prompt }
    ],
    temperature: 0.0,
    response_format: { type: "json_object" },
    stream: false,
    ...(config.provider === "openrouter" ? {
      extra_headers: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "poitto",
      },
    } : {}),
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response");

  console.log("[LLM] Raw response:", content);

  const parsed = JSON.parse(content);
  const taskInfo = buildTaskInfoFromLlmResponse(parsed, input);

  return buildParseResult(taskInfo, input);
}
