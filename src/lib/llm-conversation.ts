// テスト用：Server Action経由での文字化けを回避するため、直接呼び出し版
"use server";

import OpenAI from "openai";
import { LlmConfig } from "@/lib/local-storage";
import { 
  TaskInfo, 
  ParseResult, 
  REQUIRED_FIELDS,
  generateQuestion,
  getFieldOptions,
} from "@/domain/task/task-fields";
import { normalizeDateTime } from "@/domain/task/time-utils";
import { toTaskInfo } from "@/types/chat";

export async function parseTaskTest(input: string, config: LlmConfig): Promise<string> {
  const openai = new OpenAI({ 
    apiKey: config.apiKey,
    ...(config.provider === "openrouter" ? {
      baseURL: "https://openrouter.ai/api/v1",
    } : {})
  });

  const prompt = `日本語入力からタスク情報を抽出してください。

入力: "${input}"

出力形式:
{
  "title": "タスク内容",
  "scheduledAt": "ISO8601またはnull",
  "deadline": "ISO8601またはnull",
  "category": "personal"
}`;

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: "日本語タスク解析" },
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
  
  // 文字列として返す（オブジェクトではなく）
  return content || "{\"title\":\"error\"}";
}

export async function parseTaskWithConversation(
  input: string,
  config: LlmConfig,
  previousContext: string = "",
  currentTaskInfo: Partial<TaskInfo> = {}
): Promise<ParseResult> {
  const isFirstInput = !previousContext || previousContext === "";
  
  try {
    const result = isFirstInput 
      ? await parseFirstInput(input, config)
      : parseContinuation(input, currentTaskInfo);
    
    console.log("[Server] Result before return:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Parse error:", error);
    return createFallbackResult(input);
  }
}

async function parseFirstInput(input: string, config: LlmConfig): Promise<ParseResult> {
  const openai = new OpenAI({ 
    apiKey: config.apiKey,
    ...(config.provider === "openrouter" ? {
      baseURL: "https://openrouter.ai/api/v1",
    } : {})
  });

  const prompt = `日本語入力からタスク情報を抽出してください。

【入力】
"${input}"

【抽出項目】
1. title: タスク内容（時間表現を除く純粋な内容）
2. scheduledDate: 実行予定日（YYYY-MM-DD、あれば）
3. scheduledTime: 実行予定時刻（HH:mmまたは時間帯、あれば）
3. deadline: 期限（ISO8601、あれば）
4. category: カテゴリ（shopping/reply/work/personal/other、推測できれば）

【現在時刻】${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

【出力形式】
必ず以下のJSONのみを出力：
{
  "title": "タスク内容",
  "scheduledDate": "YYYY-MM-DDまたはnull",
  "scheduledTime": "HH:mmまたは時間帯(morning/noon/afternoon/evening)またはnull",
  "deadline": "YYYY-MM-DDまたはnull",
  "category": "personalまたはnull"
}

重要：titleは必ず具体的な内容に。「（タイトル未定）」は使わない。
時間表現はscheduledDate/scheduledTime/deadlineに、残りがtitle。`;

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

  console.log("[Server] LLM Raw:", content);
  
  const parsed = JSON.parse(content);
  
  // LLMレスポンスから日時を抽出
  const deadline = normalizeDateTime(parsed.deadline);
  const scheduled = normalizeDateTime(parsed.scheduledAt || parsed.scheduledDate);
  const scheduledDate = scheduled ? scheduled.split('T')[0] : null;
  const scheduledTime = scheduled && scheduled.includes('T') ? scheduled.split('T')[1].slice(0, 5) : null;
  
  const taskInfo: TaskInfo = {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : input,
    category: ["shopping", "reply", "work", "personal", "other"].includes(parsed.category) ? parsed.category : null,
    deadline,
    scheduledDate,
    scheduledTime,
    durationMinutes: null,
  };

  const missing = REQUIRED_FIELDS.filter(f => !taskInfo[f as keyof TaskInfo]);

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

function parseContinuation(input: string, currentTaskInfo: Partial<TaskInfo>): ParseResult {
  // 継続処理はシンプルに
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

function createFallbackResult(input: string): ParseResult {
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
