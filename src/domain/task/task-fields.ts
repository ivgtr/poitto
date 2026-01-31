import { REQUIRED_FIELDS, OPTIONAL_FIELDS } from "./validation";

export interface TaskInfo {
  title: string | null;
  category: string | null;
  deadline: string | null;
  scheduledAt: string | null;
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
  { label: string; question: string; options: string[] }
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
  },
  deadline: {
    label: "期限",
    question: "いつまでに完了させますか？",
    options: ["今日", "明日", "今週中", "来週", "期限なし"],
  },
  scheduledAt: {
    label: "実行予定",
    question: "いつ実行する予定ですか？",
    options: ["午前中", "午後", "夜", "未定"],
  },
  durationMinutes: {
    label: "所要時間",
    question: "どのくらいの時間がかかりそう？",
    options: ["15分", "30分", "1時間", "2時間以上", "不明"],
  },
};

export function getFieldOptions(fieldName: string): string[] {
  return FIELD_LABELS[fieldName]?.options || [];
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
