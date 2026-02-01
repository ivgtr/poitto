"use server";

import OpenAI from "openai";
import { LlmConfig } from "@/lib/local-storage";
import { TaskInfo, ParseResult, FIELD_LABELS } from "@/domain/task/task-fields";
import { toTaskInfo } from "@/types/chat";
import { buildContinuationPrompt } from "./prompt-continuation";
import { buildParseResult } from "./result-builder";

const SPECIAL_COMMANDS = ["登録する", "登録しない", "とりあえず登録", "スキップ"];

/**
 * 継続入力を処理
 * 特殊コマンドの場合はローカル処理、それ以外はLLM解析
 */
export async function parseContinuation(
  input: string,
  currentTaskInfo: Partial<TaskInfo>,
  currentField: string | null,
  config: LlmConfig
): Promise<ParseResult> {
  // 特殊コマンドはローカル処理
  if (SPECIAL_COMMANDS.includes(input.trim())) {
    return createContinuationResult(currentTaskInfo, input);
  }

  // 現在のフィールドの選択肢と完全一致するかチェック
  if (currentField) {
    const fieldOptions = FIELD_LABELS[currentField]?.options || [];
    const isExactMatch = fieldOptions.includes(input.trim());

    if (isExactMatch) {
      // 完全一致 → ローカル処理（変更なし）
      return createContinuationResult(currentTaskInfo, input);
    }
  }

  // 追加情報あり → LLM解析
  return await parseContinuationWithLLM(input, currentTaskInfo, currentField, config);
}

/**
 * LLMを使用して継続入力をパース
 */
async function parseContinuationWithLLM(
  input: string,
  currentTaskInfo: Partial<TaskInfo>,
  currentField: string | null,
  config: LlmConfig
): Promise<ParseResult> {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    ...(config.provider === "openrouter" ? {
      baseURL: "https://openrouter.ai/api/v1",
    } : {})
  });

  const prompt = buildContinuationPrompt(input, currentTaskInfo, currentField);

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

  console.log("[LLM Continuation] Raw response:", content);

  const parsed = JSON.parse(content);

  // Parse scheduledDate from continuation
  let scheduledDate: string | null = currentTaskInfo.scheduledDate || null;
  if (parsed.scheduledDate && typeof parsed.scheduledDate === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed.scheduledDate)) {
      scheduledDate = parsed.scheduledDate;
    } else {
      const { normalizeDateTime } = await import("@/domain/task/time-utils");
      const normalized = normalizeDateTime(parsed.scheduledDate);
      if (normalized) {
        scheduledDate = normalized.split('T')[0];
      }
    }
  }

  // Parse scheduledTime from continuation
  let scheduledTime: string | null = currentTaskInfo.scheduledTime || null;
  if (parsed.scheduledTime && typeof parsed.scheduledTime === "string" && parsed.scheduledTime !== "null") {
    const timeValue = parsed.scheduledTime.trim();
    if (/^\d{2}:\d{2}$/.test(timeValue) ||
        ["morning", "noon", "afternoon", "evening"].includes(timeValue)) {
      scheduledTime = timeValue;
    }
  }

  // 現在のタスク情報とマージ
  const { parseDurationToMinutes } = await import("@/domain/task/time-utils");
  const taskInfo: TaskInfo = {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : (currentTaskInfo.title || input),
    category: ["shopping", "reply", "work", "personal", "other"].includes(parsed.category as string) ? parsed.category as string : (currentTaskInfo.category || null),
    scheduledDate,
    scheduledTime,
    deadline: (await import("@/domain/task/time-utils")).normalizeDateTime(parsed.deadline) || (typeof parsed.deadline === "string" ? parsed.deadline : (currentTaskInfo.deadline || null)),
    durationMinutes: parseDurationToMinutes(String(parsed.durationMinutes)) || (typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0 ? parsed.durationMinutes : (currentTaskInfo.durationMinutes || null)),
  };

  return buildParseResult(taskInfo, input);
}

/**
 * 継続入力の結果を作成（ローカル処理用）
 */
function createContinuationResult(
  currentTaskInfo: Partial<TaskInfo>,
  input: string
): ParseResult {
  return {
    taskInfo: toTaskInfo(currentTaskInfo),
    missingFields: [],
    nextQuestion: null,
    clarificationOptions: ["登録する", "登録しない"],
    isComplete: true,
    rawInput: input,
    conversationContext: currentTaskInfo.title || "",
  };
}
