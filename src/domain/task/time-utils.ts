export function getJSTDate(): Date {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  return new Date(now.getTime() + jstOffset);
}

export function toJSTISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
}

export function parseTimeFromInput(input: string): { hour: number; minute: number } | null {
  const patterns = [
    /(\d{1,2})\s*時(?:\s*(\d{1,2})\s*分?)?/,
    /(\d{1,2}):(\d{2})/,
    /午前(\d{1,2})\s*時?(?:\s*(\d{1,2})\s*分?)?/,
    /午後(\d{1,2})\s*時?(?:\s*(\d{1,2})\s*分?)?/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;

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

export function createJSTScheduledAt(
  time: { hour: number; minute: number },
  daysFromNow: number = 1
): string {
  const jstNow = getJSTDate();
  const targetDate = new Date(jstNow);
  targetDate.setDate(targetDate.getDate() + daysFromNow);
  targetDate.setHours(time.hour, time.minute, 0, 0);

  return toJSTISOString(targetDate);
}

/**
 * 相対日付表現を絶対日時に変換
 * 「明日」「今日」「来週」などをISO8601形式に変換
 */
export function parseRelativeDate(
  input: string,
  baseDate: Date = new Date()
): { date: Date; isEndOfDay: boolean } | null {
  const normalized = input.toLowerCase().trim();
  
  const targetDate = new Date(baseDate);
  let isEndOfDay = false;

  // 今日
  if (normalized.includes("今日")) {
    // そのまま
  }
  // 明日
  else if (normalized.includes("明日")) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  // 明後日
  else if (normalized.includes("明後日")) {
    targetDate.setDate(targetDate.getDate() + 2);
  }
  // 昨日（過去のタスク）
  else if (normalized.includes("昨日")) {
    targetDate.setDate(targetDate.getDate() - 1);
  }
  // 今週中（今週の日曜日）
  else if (normalized.includes("今週")) {
    const dayOfWeek = targetDate.getDay(); // 0=日曜, 1=月曜...
    const daysUntilSunday = 7 - dayOfWeek;
    targetDate.setDate(targetDate.getDate() + daysUntilSunday);
    isEndOfDay = true;
  }
  // 来週（来週の月曜日）
  else if (normalized.includes("来週")) {
    const dayOfWeek = targetDate.getDay();
    const daysUntilNextMonday = (8 - dayOfWeek) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + daysUntilNextMonday);
  }
  // 今月（今月末）
  else if (normalized.includes("今月")) {
    targetDate.setMonth(targetDate.getMonth() + 1);
    targetDate.setDate(0); // 月末日
    isEndOfDay = true;
  }
  // 来月（来月初）
  else if (normalized.includes("来月")) {
    targetDate.setMonth(targetDate.getMonth() + 1);
    targetDate.setDate(1);
  }
  // 期限なし
  else if (normalized.includes("期限なし") || normalized.includes("なし")) {
    return null;
  }
  // 未定
  else if (normalized.includes("未定")) {
    return null;
  }
  else {
    return null;
  }

  return { date: targetDate, isEndOfDay };
}

/**
 * LLMが返した曖昧な日時文字列を正規化
 * "明日" → "2026-02-02T23:59:00+09:00"
 */
export function normalizeDateTime(
  input: string | null,
  baseDate: Date = new Date()
): string | null {
  if (!input || input === "null") return null;

  // すでにISO8601形式の場合はそのまま返す
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(input)) {
    return input.includes("+") ? input : `${input}+09:00`;
  }

  // 相対日付を解析
  const relativeDate = parseRelativeDate(input, baseDate);
  if (!relativeDate) return null;

  const { date, isEndOfDay } = relativeDate;

  // 時刻も含まれているかチェック
  const timeMatch = input.match(/(\d{1,2})\s*時(?:\s*(\d{1,2})\s*分?)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    
    // 午後の場合
    if (input.includes("午後") && hour !== 12) {
      hour += 12;
    }
    
    date.setHours(hour, minute, 0, 0);
  } else if (isEndOfDay) {
    // 期限の場合は23:59
    date.setHours(23, 59, 0, 0);
  } else {
    // デフォルトは9:00
    date.setHours(9, 0, 0, 0);
  }

  return toJSTISOString(date);
}

/**
 * 所要時間を分単位に変換
 * "1時間" → 60
 * "30分" → 30
 * "2時間半" → 150
 * "60"（分として解釈）→ 60
 */
export function parseDurationToMinutes(input: string): number | null {
  const normalized = input.toLowerCase().replace(/\s+/g, "");

  // 時間と分のパターン
  const hourMatch = normalized.match(/(\d+\.?\d*)\s*時間?/);
  const minuteMatch = normalized.match(/(\d+)\s*分/);
  const halfMatch = normalized.match(/半/);

  let totalMinutes = 0;
  let hasValue = false;

  // 時間
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    totalMinutes += hours * 60;
    hasValue = true;
  }

  // 分
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1], 10);
    totalMinutes += minutes;
    hasValue = true;
  }

  // 「半」（30分）
  if (halfMatch && hourMatch) {
    totalMinutes += 30;
  }

  // 数値のみの場合は分として解釈（LLMが既に分単位で返しているケース）
  if (!hasValue) {
    const numMatch = normalized.match(/^(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      // LLMは既に分単位で返していると仮定
      totalMinutes = num;
      hasValue = true;
    }
  }

  return hasValue && totalMinutes > 0 ? Math.round(totalMinutes) : null;
}

/**
 * 期限（deadline）用の日時を生成（常に23:59）
 * @param dateStr YMD形式の日付（"2026-02-02"）
 * @returns ISO8601形式の日時（"2026-02-02T23:59:00+09:00"）
 */
export function createDeadlineDateTime(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00+09:00");
  date.setHours(23, 59, 0, 0);
  return toJSTISOString(date);
}

/**
 * 予定日時を分解してdateとtimeを取得
 * @param isoDateTime ISO8601形式の日時
 * @returns { date: "2026-02-02", time: "15:00" | null }
 */
export function splitDateTime(isoDateTime: string): { date: string; time: string | null } {
  if (!isoDateTime) return { date: "", time: null };
  
  const date = isoDateTime.slice(0, 10);
  const timeMatch = isoDateTime.match(/T(\d{2}:\d{2}):\d{2}/);
  const time = timeMatch ? timeMatch[1] : null;
  
  return { date, time };
}

/**
 * 時刻スロット（"morning"など）から実際の時刻を取得
 * @param slot 時刻スロット名
 * @returns "HH:mm"形式の時刻
 */
export function getTimeFromSlot(slot: string): string | null {
  const slots: Record<string, string> = {
    morning: "07:00",
    noon: "12:00",
    afternoon: "15:00",
    evening: "18:00",
    unspecified: "09:00",
  };
  
  return slots[slot] || null;
}

/**
 * 予定日時をISO8601形式に結合
 * @param date YMD形式（"2026-02-02"）
 * @param time HH:mm形式またはスロット名、またはnull
 * @returns ISO8601形式の日時、またはnull（時刻なしの場合）
 */
export function combineDateAndTime(date: string, time: string | null): string | null {
  if (!date) return null;
  if (!time) return null; // 時刻なしの場合はnull（inbox用）
  
  // スロット名の場合は変換
  const actualTime = getTimeFromSlot(time) || time;
  
  return `${date}T${actualTime}:00+09:00`;
}

/**
 * 残り期日ラベルを取得（Inbox専用）
 * @param deadline 期限日時（DateまたはISO8601文字列）
 * @returns 残り期日ラベル（例: "本日中", "明日", "3日後", "2週間後", "1ヶ月以上"）
 */
export function getRemainingDaysLabel(deadline: Date | null | string): string {
  if (!deadline) return "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffMs = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "期限切れ";
  if (diffDays === 0) return "本日中";
  if (diffDays === 1) return "明日";
  if (diffDays <= 3) return `${diffDays}日後`;
  if (diffDays <= 13) return "2週間後";
  if (diffDays <= 34) return `${Math.ceil(diffDays / 7)}週間後`;
  return "1ヶ月以上";
}

/**
 * 残り期日ラベルの色クラスを取得
 * @param deadline 期限日時（DateまたはISO8601文字列）
 * @returns Tailwind CSSクラス（赤・橙・緑の3パターン）
 */
export function getRemainingDaysColor(deadline: Date | null | string): string {
  if (!deadline) return "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffMs = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return "bg-red-100 text-red-700 border-red-200";
  if (diffDays === 1) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-green-100 text-green-700 border-green-200";
}
