"use server";

import OpenAI from "openai";
import { LlmConfig } from "@/lib/local-storage";
import { TaskInfo, ParseResult, REQUIRED_FIELDS, generateQuestion, getFieldOptions, FIELD_LABELS } from "@/domain/task/task-fields";
import { normalizeDateTime, parseDurationToMinutes } from "@/domain/task/time-utils";
import { toTaskInfo } from "@/types/chat";

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

async function parseFirstInput(input: string, config: LlmConfig): Promise<ParseResult> {
  const openai = new OpenAI({ 
    apiKey: config.apiKey,
    ...(config.provider === "openrouter" ? {
      baseURL: "https://openrouter.ai/api/v1",
    } : {})
  });

  const now = new Date();
  const currentTimeStr = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const prompt = `あなたは日本語の自然言語入力からタスク情報を高精度で抽出するエキスパートです。

【入力】
"""${input}"""

【現在時刻（JST）】
${currentTimeStr}

【抽出項目】
1. title: タスク内容（時間表現を除き、具体的な動作を含める）
2. scheduledDate: 実行予定日（YYYY-MM-DD形式、あれば）
3. scheduledTime: 実行予定時間（"HH:mm"または"morning"/"noon"/"afternoon"/"evening"、あれば。不明確な場合はnull）
4. deadline: 期限（ISO8601 JST+09:00、あれば。常に23:59で設定）
5. durationMinutes: 所要時間（分単位の数値、あれば）
6. category: カテゴリ（shopping/reply/work/personal/other、推測できれば）

【抽出ルール】
- title: 時間表現（明日、今日、3時、1時間など）は除外。動詞を含む具体的な行動を抽出
- scheduledDate: "明日"→"${tomorrow}"、"今日"→現在日、日付部分のみを抽出
- scheduledTime: 
  - 具体的時刻"3時"→"15:00"、"午前9時"→"09:00"
  - 時間帯"午前中"→"morning"、"昼"→"noon"、"午後"→"afternoon"、"夜"→"evening"
  - 時刻が不明確（"明日"だけなど）→ null（この場合インボックスへ）
- deadline: "明日までに"→"${tomorrow}T23:59:00+09:00"、"今週中"→今週日曜の23:59
- durationMinutes: "1時間"→60、"30分"→30、"2時間半"→150、"1.5時間"→90
- category: 買い物→shopping、返信/連絡→reply、業務/会議→work、個人/趣味→personal

【具体例】
入力: "明日の午後2時から1時間ほど会議"
→ title: "会議"、scheduledDate: "${tomorrow}"、scheduledTime: "14:00"、durationMinutes: 60、category: "work"

入力: "明日の午前中に買い物"
→ title: "買い物"、scheduledDate: "${tomorrow}"、scheduledTime: "morning"、category: "shopping"

入力: "明日までにレポートを書く、所要時間3時間"
→ title: "レポートを書く"、deadline: "${tomorrow}T23:59:00+09:00"、durationMinutes: 180、category: "work"

入力: "来週のどこかで会議"
→ title: "会議"、scheduledDate: "${dayAfterTomorrow}"、scheduledTime: null（時刻不明確なのでインボックスへ）

【重要】
- titleは必ず具体的な動作を含む（「（タイトル未定）」は使わない）
- scheduledTimeは時刻が明確な場合のみ設定。不明確な場合はnull（インボックスへ）
- deadlineは常に23:59の時刻で設定
- durationMinutesは数値（分）で出力。nullでも可

【出力形式 - 厳密に遵守】
必ず以下のJSONのみを出力：
{
  "title": "string（具体的な動作）",
  "scheduledDate": "YYYY-MM-DDまたはnull",
  "scheduledTime": "HH:mmまたはmorning/noon/afternoon/eveningまたはnull",
  "deadline": "YYYY-MM-DDTHH:mm:ss+09:00またはnull",
  "durationMinutes": "numberまたはnull",
  "category": "shopping|reply|work|personal|otherまたはnull"
}`;

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
  
  // Parse scheduledDate - should be YYYY-MM-DD format
  let scheduledDate: string | null = null;
  if (parsed.scheduledDate && typeof parsed.scheduledDate === "string") {
    // Check if it's already YMD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed.scheduledDate)) {
      scheduledDate = parsed.scheduledDate;
    } else {
      // Try to normalize from relative date
      const normalized = normalizeDateTime(parsed.scheduledDate);
      if (normalized) {
        scheduledDate = normalized.split('T')[0];
      }
    }
  }

  // Parse scheduledTime - can be HH:mm, time slot, or null
  let scheduledTime: string | null = null;
  if (parsed.scheduledTime && typeof parsed.scheduledTime === "string" && parsed.scheduledTime !== "null") {
    const timeValue = parsed.scheduledTime.trim();
    // Check if it's a valid time format (HH:mm or time slot)
    if (/^\d{2}:\d{2}$/.test(timeValue) || 
        ["morning", "noon", "afternoon", "evening"].includes(timeValue)) {
      scheduledTime = timeValue;
    }
  }

  const taskInfo: TaskInfo = {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : input,
    category: ["shopping", "reply", "work", "personal", "other"].includes(parsed.category) ? parsed.category : null,
    scheduledDate,
    scheduledTime,
    deadline: normalizeDateTime(parsed.deadline) || (typeof parsed.deadline === "string" ? parsed.deadline : null),
    durationMinutes: parseDurationToMinutes(String(parsed.durationMinutes)) || (typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0 ? parsed.durationMinutes : null),
  };

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

async function parseContinuation(
  input: string, 
  currentTaskInfo: Partial<TaskInfo>,
  currentField: string | null,
  config: LlmConfig
): Promise<ParseResult> {
  // 特殊コマンドはローカル処理
  const specialCommands = ["登録する", "登録しない", "とりあえず登録", "スキップ"];
  if (specialCommands.includes(input.trim())) {
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

  // 現在のフィールドの選択肢と完全一致するかチェック
  if (currentField) {
    const fieldOptions = FIELD_LABELS[currentField]?.options || [];
    const isExactMatch = fieldOptions.includes(input.trim());
    
    if (isExactMatch) {
      // 完全一致 → ローカル処理（変更なし）
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
  }

  // 追加情報あり → LLM解析
  return await parseContinuationWithLLM(input, currentTaskInfo, currentField, config);
}

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

  const now = new Date();
  const currentTimeStr = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  const prompt = `あなたはタスク情報を更新するエキスパートです。現在のタスク情報とユーザーの追加入力から、不足している情報を埋めてください。

【現在のタスク情報】
${JSON.stringify(currentTaskInfo, null, 2)}

【現在の質問フィールド】
${currentField || "なし"}

【ユーザーの追加入入力】
"""${input}"""

【現在時刻（JST）】
${currentTimeStr}

【タスク】
上記の入力から、現在のタスク情報を更新してください。

【更新ルール】
1. 新しい情報を優先: 追加入入力が既存情報と矛盾する場合、新しい入力を優先
2. 追加情報を抽出: 
   - 「明日11時」→ scheduledDate: "2026-02-02", scheduledTime: "11:00"
   - 「明日の午前中」→ scheduledDate: "2026-02-02", scheduledTime: "morning"
   - 「明日だけ」→ scheduledDate: "2026-02-02", scheduledTime: null（時刻不明確）
3. 単純な選択肢（「明日」「今日」など）は現在のフィールドに設定
4. titleは変更しない（既存のtitleを保持）
5. 時刻が不明確な場合はscheduledTimeをnullに設定（その場合インボックスへ）

【具体例】
現在: { title: "会議", category: "work", scheduledDate: null, scheduledTime: null }
入力: "明日の午後3時"
→ scheduledDate: "2026-02-02", scheduledTime: "15:00" を設定

現在: { title: "会議", category: "work", scheduledDate: null, scheduledTime: null }
入力: "明日の午前中"
→ scheduledDate: "2026-02-02", scheduledTime: "morning" を設定

現在: { title: "レポート", deadline: null }
入力: "明日までに"
→ deadline: "2026-02-02T23:59:00+09:00" を設定

現在: { title: "タスク", durationMinutes: null }
入力: "2時間かかる"
→ durationMinutes: 120 を設定

【出力形式】
{
  "title": "string（変更なしなら既存値）",
  "scheduledDate": "YYYY-MM-DD | null",
  "scheduledTime": "HH:mm または morning/noon/afternoon/evening | null",
  "deadline": "YYYY-MM-DDTHH:mm:ss+09:00 | null",
  "durationMinutes": "number | null",
  "category": "string | null"
}`;

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
  const taskInfo: TaskInfo = {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : (currentTaskInfo.title || input),
    category: ["shopping", "reply", "work", "personal", "other"].includes(parsed.category) ? parsed.category : (currentTaskInfo.category || null),
    scheduledDate,
    scheduledTime,
    deadline: normalizeDateTime(parsed.deadline) || (typeof parsed.deadline === "string" ? parsed.deadline : (currentTaskInfo.deadline || null)),
    durationMinutes: parseDurationToMinutes(String(parsed.durationMinutes)) || (typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0 ? parsed.durationMinutes : (currentTaskInfo.durationMinutes || null)),
  };

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
