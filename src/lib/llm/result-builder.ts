import { LlmConfig } from "@/lib/local-storage";
import { TaskInfo, ParseResult, REQUIRED_FIELDS, generateQuestion, getFieldOptions } from "@/domain/task/task-fields";
import { normalizeDateTime, parseDurationToMinutes } from "@/domain/task/time-utils";

/**
 * フォールバック結果を作成
 * LLM呼び出しが失敗した場合に使用
 */
export function createFallbackResult(input: string): ParseResult {
  return {
    taskInfo: {
      title: input,
      category: "personal",
      deadline: null,
      scheduledDate: null,
      scheduledTime: null,
      durationMinutes: null,
    },
    missingFields: [],
    nextQuestion: null,
    clarificationOptions: ["登録する", "登録しない"],
    isComplete: true,
    rawInput: input,
    conversationContext: input,
  };
}

/**
 * パース結果の共通部分を構築
 */
export function buildParseResult(
  taskInfo: TaskInfo,
  input: string
): ParseResult {
  const missing = REQUIRED_FIELDS.filter(f => !taskInfo[f]);

  return {
    taskInfo,
    missingFields: missing,
    nextQuestion: missing[0] ? generateQuestion(missing[0]) : null,
    clarificationOptions: missing[0] ? [...getFieldOptions(missing[0]), "登録しない"] : ["登録する", "登録しない"],
    isComplete: missing.length === 0,
    rawInput: input,
    conversationContext: taskInfo.title || input,
  };
}

/**
 * scheduledDateをパース
 */
export function parseScheduledDate(parsed: Record<string, unknown>): string | null {
  if (parsed.scheduledDate && typeof parsed.scheduledDate === "string") {
    // Check if it's already YMD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed.scheduledDate)) {
      return parsed.scheduledDate;
    } else {
      // Try to normalize from relative date
      const normalized = normalizeDateTime(parsed.scheduledDate);
      if (normalized) {
        return normalized.split('T')[0];
      }
    }
  }
  return null;
}

/**
 * scheduledTimeをパース
 */
export function parseScheduledTime(parsed: Record<string, unknown>): string | null {
  if (parsed.scheduledTime && typeof parsed.scheduledTime === "string" && parsed.scheduledTime !== "null") {
    const timeValue = parsed.scheduledTime.trim();
    // Check if it's a valid time format (HH:mm or time slot)
    if (/^\d{2}:\d{2}$/.test(timeValue) || 
        ["morning", "noon", "afternoon", "evening"].includes(timeValue)) {
      return timeValue;
    }
  }
  return null;
}

/**
 * LLMレスポンスからTaskInfoを構築
 */
export function buildTaskInfoFromLlmResponse(
  parsed: Record<string, unknown>,
  input: string
): TaskInfo {
  const scheduledDate = parseScheduledDate(parsed);
  const scheduledTime = parseScheduledTime(parsed);

  return {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : input,
    category: ["shopping", "reply", "work", "personal", "other"].includes(parsed.category as string) ? parsed.category as string : null,
    scheduledDate,
    scheduledTime,
    deadline: (typeof parsed.deadline === "string" ? normalizeDateTime(parsed.deadline) : null) || null,
    durationMinutes: parseDurationToMinutes(String(parsed.durationMinutes)) || (typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0 ? parsed.durationMinutes : null),
  };
}
