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
2. scheduledAt: 実行予定時刻（ISO8601、JST+09:00、あれば）
3. deadline: 期限（ISO8601、あれば）
4. category: カテゴリ（shopping/reply/work/personal/other、推測できれば）

【現在時刻】${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

【出力形式】
{
  "title": "タスク内容",
  "scheduledAt": "2026-01-31T15:00:00+09:00またはnull",
  "deadline": "2026-01-31T23:59:00+09:00またはnull",
  "category": "personalまたはnull"
}

重要：titleは必ず具体的な内容にしてください。「（タイトル未定）」は使わないでください。
時間表現はscheduledAt/deadlineに、残りがtitleになります。`;

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
  
  const taskInfo: TaskInfo = {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : input,
    category: ["shopping", "reply", "work", "personal", "other"].includes(parsed.category) ? parsed.category : null,
    scheduledAt: typeof parsed.scheduledAt === "string" ? parsed.scheduledAt : null,
    deadline: typeof parsed.deadline === "string" ? parsed.deadline : null,
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
    taskInfo: currentTaskInfo as TaskInfo,
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
      scheduledAt: null,
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
