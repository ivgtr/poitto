import { getJSTDate, toJSTISOString } from "./time-utils";

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
