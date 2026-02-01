/**
 * 継続入力用のLLMプロンプト
 */

import { TaskInfo } from "@/domain/task/task-fields";

export function buildContinuationPrompt(
  input: string,
  currentTaskInfo: Partial<TaskInfo>,
  currentField: string | null
): string {
  const now = new Date();
  const currentTimeStr = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  return `あなたはタスク情報を更新するエキスパートです。現在のタスク情報とユーザーの追加入力から、不足している情報を埋めてください。

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
}
