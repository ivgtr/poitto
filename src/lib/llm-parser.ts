"use server";

import OpenAI from "openai";
import { LlmConfig } from "@/lib/local-storage";

export interface ParsedTask {
  title: string;
  category: string;
  deadline: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  clarificationOptions: string[] | null;
  rawInput: string;
}

export async function parseTaskWithLLM(
  input: string,
  config: LlmConfig
): Promise<ParsedTask> {
  if (config.provider === "openai") {
    return parseWithOpenAI(input, config);
  } else {
    return parseWithOpenRouter(input, config);
  }
}

const systemPrompt = `あなたはタスク管理アプリのパーサーです。ユーザーの自然言語入力からタスク情報を抽出してください。

抽出項目:
1. title: タスクの内容（簡潔に）
2. category: カテゴリ（shopping, reply, work, personal, other のいずれか）
3. deadline: 期限日時（ISO8601形式、ない場合はnull）
4. scheduledAt: 実行予定日時（ISO8601形式、ない場合はnull）
5. durationMinutes: 所要時間（分単位、推測できない場合はnull）
6. needsClarification: 補足情報が必要か（true/false）
7. clarificationQuestion: 補足質問（必要な場合のみ）
8. clarificationOptions: 選択肢の配列（最大3つ + 「入力しない」）

判定ルール:
- "明日までに" → deadlineを設定
- "明日やる" → scheduledAtを設定
- 期限と実行予定が両方ある場合は両方設定
- 情報不足で期限/予定が不明確ならneedsClarification=true
- 買い物リスト→shopping、返信→reply、仕事→work、個人→personal

clarificationOptionsの例:
- いつやるか不明確: ["午前中", "午後", "夜", "入力しない"]
- 所要時間不明確: ["15分", "30分", "1時間", "入力しない"]
- カテゴリ不明確: ["仕事", "個人", "入力しない"]

現在時刻: ${new Date().toISOString()}

JSONのみを返してください。`;

async function parseWithOpenAI(input: string, config: LlmConfig): Promise<ParsedTask> {
  const openai = new OpenAI({ apiKey: config.apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      stream: false,
    });

    // 非ストリーミングレスポンスなのでchoicesにアクセス可能
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content);
    return normalizeParsedTask(parsed, input);
  } catch (error) {
    console.error("OpenAI parsing error:", error);
    return createFallbackTask(input);
  }
}

async function parseWithOpenRouter(input: string, config: LlmConfig): Promise<ParsedTask> {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.3,
      stream: false,
      ...(config.provider === "openrouter" ? {
        extra_headers: {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "poitto",
        },
      } : {}),
    });

    // 非ストリーミングレスポンスなのでchoicesにアクセス可能
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;

    const parsed = JSON.parse(jsonContent);
    return normalizeParsedTask(parsed, input);
  } catch (error) {
    console.error("OpenRouter parsing error:", error);
    return createFallbackTask(input);
  }
}

// unknown型を受け取り、型ガードで検証
function normalizeParsedTask(parsed: unknown, input: string): ParsedTask {
  if (!isObject(parsed)) {
    return createFallbackTask(input);
  }

  // clarificationOptionsの検証
  let options: string[] | null = null;
  if (isArray(parsed.clarificationOptions)) {
    options = parsed.clarificationOptions.filter(isString);
  }
  if (options && !options.includes("入力しない")) {
    options = [...options, "入力しない"];
  }

  return {
    title: isString(parsed.title) ? parsed.title : input,
    category: isString(parsed.category) ? parsed.category : "other",
    deadline: isString(parsed.deadline) ? parsed.deadline : null,
    scheduledAt: isString(parsed.scheduledAt) ? parsed.scheduledAt : null,
    durationMinutes: isNumber(parsed.durationMinutes) ? parsed.durationMinutes : null,
    needsClarification: isBoolean(parsed.needsClarification) ? parsed.needsClarification : false,
    clarificationQuestion: isString(parsed.clarificationQuestion) ? parsed.clarificationQuestion : null,
    clarificationOptions: options,
    rawInput: input,
  };
}

function createFallbackTask(input: string): ParsedTask {
  return {
    title: input,
    category: "other",
    deadline: null,
    scheduledAt: null,
    durationMinutes: null,
    needsClarification: false,
    clarificationQuestion: null,
    clarificationOptions: null,
    rawInput: input,
  };
}

// 型ガード関数
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
