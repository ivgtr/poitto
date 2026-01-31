// 選択肢を直接フィールド値にマッピングするユーティリティ

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

export const REQUIRED_FIELDS = ["title", "category"];
export const OPTIONAL_FIELDS = ["deadline", "scheduledAt", "durationMinutes"];

export const FIELD_LABELS: Record<string, { label: string; question: string; options: string[] }> = {
  title: {
    label: "タイトル",
    question: "タスクの内容を教えてください",
    options: ["登録しない"]
  },
  category: {
    label: "カテゴリ",
    question: "このタスクのカテゴリは？",
    options: ["買い物", "返信", "仕事", "個人", "その他"]
  },
  deadline: {
    label: "期限",
    question: "いつまでに完了させますか？",
    options: ["今日", "明日", "今週中", "来週", "期限なし"]
  },
  scheduledAt: {
    label: "実行予定",
    question: "いつ実行する予定ですか？",
    options: ["午前中", "午後", "夜", "未定"]
  },
  durationMinutes: {
    label: "所要時間",
    question: "どのくらいの時間がかかりそう？",
    options: ["15分", "30分", "1時間", "2時間以上", "不明"]
  }
};

// JST（日本標準時）で現在時刻を取得
function getJSTDate(): Date {
  const now = new Date();
  // UTCからJST（UTC+9）に変換
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒で
  return new Date(now.getTime() + jstOffset);
}

// JSTのDateをISO8601形式（+09:00付き）で返す
function toJSTISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
}

// 選択肢を直接フィールド値に変換
export function mapOptionToFieldValue(
  option: string,
  fieldName: string
): { value: unknown; success: boolean } {
  switch (fieldName) {
    case "category":
      return mapCategoryOption(option);
    case "deadline":
      return mapDeadlineOption(option);
    case "scheduledAt":
      return mapScheduledAtOption(option);
    case "durationMinutes":
      return mapDurationOption(option);
    default:
      return { value: null, success: false };
  }
}

function mapCategoryOption(option: string): { value: string; success: boolean } {
  const mapping: Record<string, string> = {
    "買い物": "shopping",
    "返信": "reply",
    "仕事": "work",
    "個人": "personal",
    "その他": "other",
  };
  
  const value = mapping[option];
  return { value: value || "other", success: !!value };
}

function mapDeadlineOption(option: string): { value: string | null; success: boolean } {
  const jstNow = getJSTDate();
  
  switch (option) {
    case "今日":
      jstNow.setHours(23, 59, 0, 0);
      return { value: toJSTISOString(jstNow), success: true };
    case "明日":
      jstNow.setDate(jstNow.getDate() + 1);
      jstNow.setHours(23, 59, 0, 0);
      return { value: toJSTISOString(jstNow), success: true };
    case "今週中":
      // 今週の日曜日
      const dayOfWeek = jstNow.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      jstNow.setDate(jstNow.getDate() + daysUntilSunday);
      jstNow.setHours(23, 59, 0, 0);
      return { value: toJSTISOString(jstNow), success: true };
    case "来週":
      // 来週の金曜日
      jstNow.setDate(jstNow.getDate() + 7 + (5 - jstNow.getDay()));
      jstNow.setHours(23, 59, 0, 0);
      return { value: toJSTISOString(jstNow), success: true };
    case "期限なし":
      return { value: null, success: true };
    default:
      return { value: null, success: false };
  }
}

function mapScheduledAtOption(option: string): { value: string | null; success: boolean } {
  const jstNow = getJSTDate();
  const jstTomorrow = new Date(jstNow);
  jstTomorrow.setDate(jstTomorrow.getDate() + 1);
  
  switch (option) {
    case "午前中":
      jstTomorrow.setHours(9, 0, 0, 0);
      return { value: toJSTISOString(jstTomorrow), success: true };
    case "午後":
      jstTomorrow.setHours(14, 0, 0, 0);
      return { value: toJSTISOString(jstTomorrow), success: true };
    case "夜":
      jstTomorrow.setHours(20, 0, 0, 0);
      return { value: toJSTISOString(jstTomorrow), success: true };
    case "未定":
      return { value: null, success: true };
    default:
      return { value: null, success: false };
  }
}

function mapDurationOption(option: string): { value: number | null; success: boolean } {
  switch (option) {
    case "15分":
      return { value: 15, success: true };
    case "30分":
      return { value: 30, success: true };
    case "1時間":
      return { value: 60, success: true };
    case "2時間以上":
      return { value: 120, success: true };
    case "不明":
      return { value: null, success: true };
    default:
      return { value: null, success: false };
  }
}

// チャット入力から時刻をパース（例：「14時」→ 14:00）
export function parseTimeFromInput(input: string): { hour: number; minute: number } | null {
  // 「14時」「14:00」「午後2時」などのパターンを検出
  const patterns = [
    /(\d{1,2})\s*時(?:\s*(\d{1,2})\s*分?)?/,  // 14時、14時30分
    /(\d{1,2}):(\d{2})/,  // 14:00
    /午前(\d{1,2})\s*時?(?:\s*(\d{1,2})\s*分?)?/,  // 午前9時
    /午後(\d{1,2})\s*時?(?:\s*(\d{1,2})\s*分?)?/,  // 午後2時
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      
      // 午後の場合は12時間加算
      if (input.includes("午後") && hour !== 12) {
        hour += 12;
      }
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute };
      }
    }
  }
  
  return null;
}

// 時刻入力をJSTのISO8601形式に変換
export function createJSTScheduledAt(time: { hour: number; minute: number }, daysFromNow: number = 1): string {
  const jstNow = getJSTDate();
  const targetDate = new Date(jstNow);
  targetDate.setDate(targetDate.getDate() + daysFromNow);
  targetDate.setHours(time.hour, time.minute, 0, 0);
  
  return toJSTISOString(targetDate);
}

export function getFieldOptions(fieldName: string): string[] {
  return FIELD_LABELS[fieldName]?.options || [];
}

export function generateQuestion(fieldName: string | undefined): string | null {
  if (!fieldName) return null;
  return FIELD_LABELS[fieldName]?.question || `${fieldName}を教えてください`;
}

// 次に尋ねるべきフィールドを特定
export function getNextMissingField(
  taskInfo: Partial<TaskInfo>,
  isInitial: boolean = false
): string | null {
  // 必須項目を先に確認
  for (const field of REQUIRED_FIELDS) {
    if (!taskInfo[field as keyof TaskInfo]) {
      return field;
    }
  }
  
  // 必須項目が揃っていれば任意項目を確認
  if (!isInitial) {
    for (const field of OPTIONAL_FIELDS) {
      if (!taskInfo[field as keyof TaskInfo]) {
        return field;
      }
    }
  }
  
  return null;
}

// 無効なtitle値のリスト
const INVALID_TITLES = [null, "", "タイトル未定", "（タイトル未定）", "タイトルなし"];

// titleが有効かチェック
export function isValidTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  
  // ホワイトスペースのみをトリムして検証
  const trimmed = title.trim();
  if (trimmed === "") return false;
  
  // nullと空文字列は無効だが、includesチェックは実行しない（常にマッチするため）
  return !INVALID_TITLES.some(invalid => {
    if (invalid === null || invalid === "") {
      return false; // すでにtrim済みなので空文字列チェックは不要
    }
    return trimmed === invalid || trimmed.includes(invalid);
  });
}

// タスク情報が完了しているかチェック
export function isTaskComplete(taskInfo: Partial<TaskInfo>): boolean {
  // titleは必須かつ有効な値である必要がある
  if (!isValidTitle(taskInfo.title)) {
    return false;
  }
  // categoryも必須
  if (!taskInfo.category) {
    return false;
  }
  return true;
}
