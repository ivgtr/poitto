/**
 * フォーム用の日時変換ユーティリティ
 * Dateオブジェクト ↔ フォーム文字列 の変換を一元化
 * 全ての変換でJSTタイムゾーン（+09:00）を保証
 */

/**
 * Dateオブジェクトをフォーム用の日付文字列（YYYY-MM-DD）に変換
 * @param date Dateオブジェクトまたはnull
 * @returns "YYYY-MM-DD"形式の文字列、nullの場合は空文字
 */
export function dateToFormDateString(date: Date | null | string): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  
  // JST基準で年月日を取得
  const jstDate = new Date(d.getTime() + (9 * 60 * 60 * 1000));
  return jstDate.toISOString().slice(0, 10);
}

/**
 * Dateオブジェクトをフォーム用の時刻文字列（HH:mm）に変換
 * @param date Dateオブジェクトまたはnull
 * @returns "HH:mm"形式の文字列、nullの場合は空文字
 */
export function dateToFormTimeString(date: Date | null | string): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  
  // JST基準で時刻を取得
  const jstDate = new Date(d.getTime() + (9 * 60 * 60 * 1000));
  return jstDate.toISOString().slice(11, 16);
}

/**
 * フォーム用の日付文字列をJSTのDateオブジェクトに変換（期限用：23:59）
 * @param dateStr "YYYY-MM-DD"形式の文字列
 * @returns JST 23:59のDateオブジェクト、無効な場合はnull
 */
export function formDateStringToDeadline(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  
  // JST 23:59として解釈
  const isoString = `${dateStr}T23:59:00+09:00`;
  const date = new Date(isoString);
  
  return isNaN(date.getTime()) ? null : date;
}

/**
 * フォームの日付・時刻文字列をJSTのDateオブジェクトに変換（予定日用）
 * @param dateStr "YYYY-MM-DD"形式の文字列
 * @param timeStr "HH:mm"形式の文字列（省略可）
 * @returns JSTのDateオブジェクト、無効な場合はnull
 */
export function formStringsToScheduledAt(
  dateStr: string,
  timeStr?: string
): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  
  // 時刻がない場合はinbox用（nullを返す）
  if (!timeStr) return null;
  
  // 時刻のバリデーション
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
  
  const isoString = `${dateStr}T${timeStr}:00+09:00`;
  const date = new Date(isoString);
  
  return isNaN(date.getTime()) ? null : date;
}

/**
 * フォーム用の日付文字列をそのまま保存用に正規化
 * @param dateStr "YYYY-MM-DD"形式の文字列
 * @returns 有効な日付文字列、無効な場合はnull
 */
export function formDateStringToScheduledDate(dateStr: string): string | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  return dateStr;
}

/**
 * scheduledAt（DateまたはISO文字列）をフォーム用に分解
 * @param scheduledAt DateオブジェクトまたはISO8601文字列
 * @returns { date: "YYYY-MM-DD", time: "HH:mm" } オブジェクト
 */
export function splitScheduledAt(
  scheduledAt: Date | string | null
): { date: string; time: string } {
  if (!scheduledAt) return { date: "", time: "" };
  
  const date = typeof scheduledAt === "string" 
    ? new Date(scheduledAt) 
    : scheduledAt;
    
  if (isNaN(date.getTime())) return { date: "", time: "" };
  
  // JST基準に変換
  const jstTime = date.getTime() + (9 * 60 * 60 * 1000);
  const jstDate = new Date(jstTime);
  
  return {
    date: jstDate.toISOString().slice(0, 10),
    time: jstDate.toISOString().slice(11, 16),
  };
}

/**
 * 所要時間（分）をフォーム用の文字列に変換
 * @param minutes 分単位の数値またはnull
 * @returns 文字列、nullの場合は空文字
 */
export function durationToFormString(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "";
  if (typeof minutes !== "number" || isNaN(minutes)) return "";
  return Math.round(minutes).toString();
}

/**
 * フォーム用の文字列を所要時間（分）に変換
 * @param str 文字列
 * @returns 分単位の数値、無効な場合はnull
 */
export function formStringToDuration(str: string): number | null {
  if (!str) return null;
  
  const num = parseInt(str, 10);
  if (isNaN(num) || num < 0) return null;
  
  return num;
}
