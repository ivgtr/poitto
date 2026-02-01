import { getJSTDate, toJSTISOString } from "./time-utils";

/**
 * フィールド名に応じた戻り値の型定義
 * titleは選択肢マッピングの対象外（自由入力から直接設定）
 */
type FieldValueMap = {
  category: { value: string; success: boolean };
  deadline: { value: string | null; success: boolean };
  scheduledDate: { value: string | null; success: boolean };
  scheduledTime: { value: string | null; success: boolean };
  durationMinutes: { value: number | null; success: boolean };
};

/**
 * 選択肢マッピング可能なフィールド名の型
 */
export type MappableField = keyof FieldValueMap;

/**
 * フィールドが選択肢マッピング可能かチェック
 */
export function isMappableField(field: string): field is MappableField {
  return ["category", "deadline", "scheduledDate", "scheduledTime", "durationMinutes"].includes(field);
}

/**
 * フィールド名に応じて適切な型でマッピング結果を返す
 */
export function mapOptionToFieldValue<K extends keyof FieldValueMap>(
  option: string,
  fieldName: K
): FieldValueMap[K];
export function mapOptionToFieldValue(
  option: string,
  fieldName: string
): { value: unknown; success: boolean } {
  switch (fieldName) {
    case "category":
      return mapCategoryOption(option);
    case "deadline":
      return mapDeadlineOption(option);
    case "scheduledDate":
      return mapScheduledDateOption(option);
    case "scheduledTime":
      return mapScheduledTimeOption(option);
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
    case "今週中": {
      const dayOfWeek = jstNow.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      jstNow.setDate(jstNow.getDate() + daysUntilSunday);
      jstNow.setHours(23, 59, 0, 0);
      return { value: toJSTISOString(jstNow), success: true };
    }
    case "来週": {
      jstNow.setDate(jstNow.getDate() + 7 + (5 - jstNow.getDay()));
      jstNow.setHours(23, 59, 0, 0);
      return { value: toJSTISOString(jstNow), success: true };
    }
    case "期限なし":
      return { value: null, success: true };
    default:
      return { value: null, success: false };
  }
}

function mapScheduledDateOption(option: string): { value: string | null; success: boolean } {
  const jstNow = getJSTDate();

  switch (option) {
    case "今日": {
      const year = jstNow.getFullYear();
      const month = String(jstNow.getMonth() + 1).padStart(2, "0");
      const day = String(jstNow.getDate()).padStart(2, "0");
      return { value: `${year}-${month}-${day}`, success: true };
    }
    case "明日": {
      const jstTomorrow = new Date(jstNow);
      jstTomorrow.setDate(jstTomorrow.getDate() + 1);
      const year = jstTomorrow.getFullYear();
      const month = String(jstTomorrow.getMonth() + 1).padStart(2, "0");
      const day = String(jstTomorrow.getDate()).padStart(2, "0");
      return { value: `${year}-${month}-${day}`, success: true };
    }
    case "今週中": {
      const dayOfWeek = jstNow.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      const targetDate = new Date(jstNow);
      targetDate.setDate(targetDate.getDate() + daysUntilSunday);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const day = String(targetDate.getDate()).padStart(2, "0");
      return { value: `${year}-${month}-${day}`, success: true };
    }
    case "来週": {
      const dayOfWeek = jstNow.getDay();
      const daysUntilNextMonday = (8 - dayOfWeek) % 7 || 7;
      const targetDate = new Date(jstNow);
      targetDate.setDate(targetDate.getDate() + daysUntilNextMonday);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const day = String(targetDate.getDate()).padStart(2, "0");
      return { value: `${year}-${month}-${day}`, success: true };
    }
    case "未定":
    case "指定しない":
      return { value: null, success: true };
    default:
      return { value: null, success: false };
  }
}

function mapScheduledTimeOption(option: string): { value: string | null; success: boolean } {
  const timeSlotMapping: Record<string, string> = {
    "午前中": "morning",
    "午後": "afternoon",
    "夜": "evening",
    "昼": "noon",
  };

  // Check if it's a time slot
  if (timeSlotMapping[option]) {
    return { value: timeSlotMapping[option], success: true };
  }

  // Check if it's a specific time (HH:mm)
  const timeMatch = option.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, success: true };
    }
  }

  if (option === "未定" || option === "指定しない") {
    return { value: null, success: true };
  }

  return { value: null, success: false };
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
