import { REQUIRED_FIELDS, OPTIONAL_FIELDS } from "./validation";

/**
 * 時刻スロットのデフォルト値（将来ユーザー設定可能）
 */
export const DEFAULT_TIME_SLOTS = {
  morning: "07:00",      // 午前中
  noon: "12:00",         // 昼
  afternoon: "15:00",    // 午後
  evening: "18:00",      // 夜/夕方
  unspecified: "09:00",  // 時刻不明確な場合
} as const;

export type TimeSlot = keyof typeof DEFAULT_TIME_SLOTS;

export interface TaskInfo {
  title: string | null;
  category: string | null;
  deadline: string | null;        // ISO8601 with 23:59 time (e.g., "2026-02-02T23:59:00+09:00")
  scheduledDate: string | null;   // YMD format (e.g., "2026-02-02")
  scheduledTime: string | null;   // "HH:mm" or TimeSlot ("morning", "afternoon", etc.) or null
  durationMinutes: number | null;
}

export interface ParseResult {
  taskInfo: TaskInfo;
  missingFields: string[];
  nextQuestion: string | null;
  clarificationOptions: string[];
  isComplete: boolean;
  rawInput: string;
  conversationContext: string;
}

export const FIELD_LABELS: Record<
  string,
  {
    label: string;
    question: string;
    options: string[];
    primaryOptions?: string[]; // プログレッシブ開示: 最初に表示する選択肢
    hasMoreOptions?: boolean; // 「もっと見る」ボタンを表示するか
  }
> = {
  title: {
    label: "タイトル",
    question: "タスクの内容を教えてください",
    options: ["登録しない"],
  },
  category: {
    label: "カテゴリ",
    question: "このタスクのカテゴリは？",
    options: ["買い物", "返信", "仕事", "個人", "その他"],
    primaryOptions: ["仕事", "個人", "その他"], // よく使う3つ
    hasMoreOptions: true,
  },
  deadline: {
    label: "期限",
    question: "いつまでに完了させますか？",
    options: ["今日", "明日", "今週中", "来週", "期限なし"],
    primaryOptions: ["今日", "明日", "期限なし"], // シンプルな3つ
    hasMoreOptions: true,
  },
  scheduledDate: {
    label: "実行予定日",
    question: "いつ実行する予定ですか？",
    options: ["今日", "明日", "今週中", "来週", "未定"],
    primaryOptions: ["今日", "明日", "未定"],
    hasMoreOptions: true,
  },
  scheduledTime: {
    label: "実行時間",
    question: "何時ごろ実行しますか？",
    options: ["午前中", "午後", "夜", "15:00", "指定しない"],
    primaryOptions: ["午前中", "午後", "指定しない"],
    hasMoreOptions: true,
  },
  durationMinutes: {
    label: "所要時間",
    question: "どのくらいの時間がかかりそう？",
    options: ["15分", "30分", "1時間", "2時間以上", "不明"],
    primaryOptions: ["15分", "30分", "1時間"], // 短い時間優先
    hasMoreOptions: true,
  },
};

/**
 * フィールドの選択肢を取得
 * @param fieldName フィールド名
 * @param showAll 全ての選択肢を表示するか（falseの場合はprimaryOptionsのみ）
 */
export function getFieldOptions(fieldName: string, showAll: boolean = true): string[] {
  const field = FIELD_LABELS[fieldName];
  if (!field) return [];

  // プログレッシブ開示: 最初はprimaryOptionsのみ表示
  if (!showAll && field.primaryOptions && field.hasMoreOptions) {
    return field.primaryOptions;
  }

  return field.options;
}

/**
 * フィールドに「もっと見る」オプションがあるか
 */
export function hasMoreOptions(fieldName: string): boolean {
  return FIELD_LABELS[fieldName]?.hasMoreOptions ?? false;
}

export function generateQuestion(fieldName: string | undefined): string | null {
  if (!fieldName) return null;
  return FIELD_LABELS[fieldName]?.question || `${fieldName}を教えてください`;
}

export function getNextMissingField(
  taskInfo: Partial<TaskInfo>,
  isInitial: boolean = false
): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (!taskInfo[field as keyof TaskInfo]) {
      return field;
    }
  }

  if (!isInitial) {
    for (const field of OPTIONAL_FIELDS) {
      if (!taskInfo[field as keyof TaskInfo]) {
        return field;
      }
    }
  }

  return null;
}

export * from "./validation";
export * from "./mapping";
export * from "./time-utils";
