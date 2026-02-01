"use server";

import { LlmConfig } from "@/lib/local-storage";
import { TaskInfo, ParseResult } from "@/domain/task/task-fields";
import { parseFirstInput } from "./first-input";
import { parseContinuation } from "./continuation";
import { createFallbackResult } from "./result-builder";

/**
 * LLMを使用してタスク入力をパース
 * 初回入力と継続入力を分けて処理
 */
export async function parseTaskWithLLM(
  input: string,
  config: LlmConfig,
  previousContext: string = "",
  currentTaskInfo: Partial<TaskInfo> = {},
  currentField: string | null = null
): Promise<ParseResult> {
  const isFirstInput = !previousContext || previousContext === "";

  try {
    if (isFirstInput) {
      return await parseFirstInput(input, config);
    } else {
      return await parseContinuation(input, currentTaskInfo, currentField, config);
    }
  } catch (error) {
    console.error("Parse error:", error);
    return createFallbackResult(input);
  }
}

// 型定義をエクスポート
export type { LlmParserConfig } from "./types";
