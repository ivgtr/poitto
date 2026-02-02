import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getJSTDate,
  toJSTISOString,
  parseRelativeDate,
  normalizeDateTime,
  parseDurationToMinutes,
  createDeadlineDateTime,
  splitDateTime,
  getTimeFromSlot,
  combineDateAndTime,
  createJSTScheduledAt,
  getRemainingDaysLabel,
  getRemainingDaysColor,
} from "./time-utils";

describe("time-utils", () => {
  describe("getJSTDate", () => {
    it("should return a date with JST offset", () => {
      const jstDate = getJSTDate();
      expect(jstDate).toBeInstanceOf(Date);
      // Note: The returned date has JST offset applied
    });
  });

  describe("toJSTISOString", () => {
    it("should convert date to JST ISO string format", () => {
      const date = new Date("2026-02-02T10:30:00");
      const result = toJSTISOString(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/);
    });

    it("should pad single digit values", () => {
      const date = new Date("2026-02-02T01:05:09");
      const result = toJSTISOString(date);
      expect(result).toContain("T01:05:09");
    });
  });

  describe("createJSTScheduledAt", () => {
    it("should create scheduled time with days offset", () => {
      const time = { hour: 14, minute: 30 };
      const result = createJSTScheduledAt(time, 1);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T14:30:00\+09:00$/);
    });

    it("should use tomorrow as default", () => {
      const time = { hour: 10, minute: 0 };
      const result = createJSTScheduledAt(time);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T10:00:00\+09:00$/);
    });
  });

  describe("parseRelativeDate", () => {
    const baseDate = new Date("2026-02-02T12:00:00"); // Monday

    it('should parse "今日" as today', () => {
      const result = parseRelativeDate("今日", baseDate);
      expect(result).not.toBeNull();
      expect(result?.date.toDateString()).toBe(baseDate.toDateString());
      expect(result?.isEndOfDay).toBe(false);
    });

    it('should parse "明日" as tomorrow', () => {
      const result = parseRelativeDate("明日", baseDate);
      expect(result?.date.getDate()).toBe(3);
      expect(result?.isEndOfDay).toBe(false);
    });

    it('should parse "明後日" as day after tomorrow', () => {
      const result = parseRelativeDate("明後日", baseDate);
      expect(result?.date.getDate()).toBe(4);
    });

    it('should parse "昨日" as yesterday', () => {
      const result = parseRelativeDate("昨日", baseDate);
      expect(result?.date.getDate()).toBe(1);
    });

    it('should parse "今週" as this Sunday', () => {
      const result = parseRelativeDate("今週", baseDate);
      expect(result?.date.getDay()).toBe(0); // Sunday
      expect(result?.isEndOfDay).toBe(true);
    });

    it('should parse "来週" as next Monday', () => {
      const result = parseRelativeDate("来週", baseDate);
      expect(result?.date.getDay()).toBe(1); // Monday
    });

    it('should parse "今月" as end of month', () => {
      const result = parseRelativeDate("今月", baseDate);
      expect(result?.date.getMonth()).toBe(1); // February
      expect(result?.date.getDate()).toBe(28); // 2026-02-28
      expect(result?.isEndOfDay).toBe(true);
    });

    it('should parse "来月" as first day of next month', () => {
      const result = parseRelativeDate("来月", baseDate);
      expect(result?.date.getMonth()).toBe(2); // March
      expect(result?.date.getDate()).toBe(1);
    });

    it('should return null for "期限なし"', () => {
      expect(parseRelativeDate("期限なし")).toBeNull();
    });

    it('should return null for "なし"', () => {
      expect(parseRelativeDate("なし")).toBeNull();
    });

    it('should return null for "未定"', () => {
      expect(parseRelativeDate("未定")).toBeNull();
    });

    it("should return null for unknown input", () => {
      expect(parseRelativeDate("不明")).toBeNull();
      expect(parseRelativeDate("random text")).toBeNull();
    });
  });

  describe("normalizeDateTime", () => {
    const baseDate = new Date("2026-02-02T12:00:00");

    it("should return null for null or 'null' input", () => {
      expect(normalizeDateTime(null)).toBeNull();
      expect(normalizeDateTime("null")).toBeNull();
    });

    it("should pass through ISO8601 format", () => {
      const isoString = "2026-02-02T14:30:00+09:00";
      expect(normalizeDateTime(isoString)).toBe(isoString);
    });

    it("should add timezone to ISO8601 without timezone", () => {
      const isoString = "2026-02-02T14:30:00";
      expect(normalizeDateTime(isoString)).toBe("2026-02-02T14:30:00+09:00");
    });

    it('should normalize "明日" with default 9:00', () => {
      const result = normalizeDateTime("明日", baseDate);
      expect(result).toMatch(/^2026-02-03T09:00:00\+09:00$/);
    });

    it('should parse "明日15時" with specific time', () => {
      const result = normalizeDateTime("明日15時", baseDate);
      expect(result).toMatch(/^2026-02-03T15:00:00\+09:00$/);
    });

    it('should parse "明日午後3時" with PM time', () => {
      const result = normalizeDateTime("明日午後3時", baseDate);
      expect(result).toMatch(/^2026-02-03T15:00:00\+09:00$/);
    });

    it('should handle "今日" with default 9:00', () => {
      const result = normalizeDateTime("今日", baseDate);
      expect(result).toMatch(/^2026-02-02T09:00:00\+09:00$/);
    });

    it("should return null for unparseable input", () => {
      expect(normalizeDateTime("不明", baseDate)).toBeNull();
    });
  });

  describe("parseDurationToMinutes", () => {
    it('should parse "1時間" as 60 minutes', () => {
      expect(parseDurationToMinutes("1時間")).toBe(60);
    });

    it('should parse "2時間" as 120 minutes', () => {
      expect(parseDurationToMinutes("2時間")).toBe(120);
    });

    it('should parse "1.5時間" as 90 minutes', () => {
      expect(parseDurationToMinutes("1.5時間")).toBe(90);
    });

    it('should parse "30分" as 30 minutes', () => {
      expect(parseDurationToMinutes("30分")).toBe(30);
    });

    it('should parse "1時間30分" as 90 minutes', () => {
      expect(parseDurationToMinutes("1時間30分")).toBe(90);
    });

    it('should parse "2時間半" as 150 minutes', () => {
      expect(parseDurationToMinutes("2時間半")).toBe(150);
    });

    it("should parse numeric-only as minutes", () => {
      expect(parseDurationToMinutes("60")).toBe(60);
      expect(parseDurationToMinutes("90")).toBe(90);
    });

    it("should return null for zero or invalid duration", () => {
      expect(parseDurationToMinutes("0")).toBeNull();
      expect(parseDurationToMinutes("不明")).toBeNull();
    });

    it("should handle whitespace variations", () => {
      expect(parseDurationToMinutes("1 時間")).toBe(60);
      expect(parseDurationToMinutes("30 分")).toBe(30);
    });
  });

  describe("createDeadlineDateTime", () => {
    it("should create deadline at 23:59 for given date", () => {
      const result = createDeadlineDateTime("2026-02-02");
      expect(result).toBe("2026-02-02T23:59:00+09:00");
    });

    it("should handle different dates", () => {
      const result = createDeadlineDateTime("2026-12-31");
      expect(result).toBe("2026-12-31T23:59:00+09:00");
    });
  });

  describe("splitDateTime", () => {
    it("should split ISO datetime into date and time", () => {
      const result = splitDateTime("2026-02-02T14:30:00+09:00");
      expect(result.date).toBe("2026-02-02");
      expect(result.time).toBe("14:30");
    });

    it("should return empty date and null time for empty input", () => {
      const result = splitDateTime("");
      expect(result.date).toBe("");
      expect(result.time).toBeNull();
    });

    it("should return null time when no time in input", () => {
      const result = splitDateTime("2026-02-02");
      expect(result.date).toBe("2026-02-02");
      expect(result.time).toBeNull();
    });
  });

  describe("getTimeFromSlot", () => {
    it("should return correct time for each slot", () => {
      expect(getTimeFromSlot("morning")).toBe("07:00");
      expect(getTimeFromSlot("noon")).toBe("12:00");
      expect(getTimeFromSlot("afternoon")).toBe("15:00");
      expect(getTimeFromSlot("evening")).toBe("18:00");
      expect(getTimeFromSlot("unspecified")).toBe("09:00");
    });

    it("should return null for unknown slot", () => {
      expect(getTimeFromSlot("unknown")).toBeNull();
      expect(getTimeFromSlot("")).toBeNull();
    });
  });

  describe("combineDateAndTime", () => {
    it("should combine date and time into ISO string", () => {
      const result = combineDateAndTime("2026-02-02", "14:30");
      expect(result).toBe("2026-02-02T14:30:00+09:00");
    });

    it("should convert time slot to actual time", () => {
      const result = combineDateAndTime("2026-02-02", "morning");
      expect(result).toBe("2026-02-02T07:00:00+09:00");
    });

    it("should return null when date is missing", () => {
      expect(combineDateAndTime("", "14:30")).toBeNull();
    });

    it("should return null when time is missing (for inbox)", () => {
      expect(combineDateAndTime("2026-02-02", null)).toBeNull();
    });
  });

  describe("getRemainingDaysLabel", () => {
    const baseDate = new Date("2026-02-02T00:00:00");

    beforeEach(() => {
      vi.setSystemTime(baseDate);
    });

    it("should return empty string for null deadline", () => {
      expect(getRemainingDaysLabel(null)).toBe("");
    });

    it("should return '期限切れ' for past deadline", () => {
      expect(getRemainingDaysLabel("2026-02-01T23:59:00")).toBe("期限切れ");
    });

    it("should return '本日中' for today's deadline", () => {
      expect(getRemainingDaysLabel("2026-02-02T23:59:00")).toBe("本日中");
    });

    it("should return '明日' for tomorrow's deadline", () => {
      expect(getRemainingDaysLabel("2026-02-03T23:59:00")).toBe("明日");
    });

    it("should return '2日後' for 2 days later", () => {
      expect(getRemainingDaysLabel("2026-02-04T23:59:00")).toBe("2日後");
    });

    it("should return '3日後' for 3 days later", () => {
      expect(getRemainingDaysLabel("2026-02-05T23:59:00")).toBe("3日後");
    });

    it("should return '2週間後' for 7-13 days later", () => {
      expect(getRemainingDaysLabel("2026-02-09T23:59:00")).toBe("2週間後");
      expect(getRemainingDaysLabel("2026-02-15T23:59:00")).toBe("2週間後");
    });

    it("should return 'N週間後' for 2-4 weeks later", () => {
      // 2月2日（基準日）から14日後 = 2月16日 = 2週間後
      expect(getRemainingDaysLabel("2026-02-16T23:59:00")).toBe("2週間後");
      // 2月2日から21日後 = 2月23日 = 3週間後
      expect(getRemainingDaysLabel("2026-02-23T23:59:00")).toBe("3週間後");
    });

    it("should return '1ヶ月以上' for 5+ weeks later", () => {
      expect(getRemainingDaysLabel("2026-03-09T23:59:00")).toBe("1ヶ月以上");
    });
  });

  describe("getRemainingDaysColor", () => {
    const baseDate = new Date("2026-02-02T00:00:00");

    beforeEach(() => {
      vi.setSystemTime(baseDate);
    });

    it("should return empty string for null deadline", () => {
      expect(getRemainingDaysColor(null)).toBe("");
    });

    it("should return red classes for overdue deadline", () => {
      expect(getRemainingDaysColor("2026-02-01T23:59:00")).toBe(
        "bg-red-100 text-red-700 border-red-200"
      );
    });

    it("should return red classes for today's deadline", () => {
      expect(getRemainingDaysColor("2026-02-02T23:59:00")).toBe(
        "bg-red-100 text-red-700 border-red-200"
      );
    });

    it("should return orange classes for tomorrow's deadline", () => {
      expect(getRemainingDaysColor("2026-02-03T23:59:00")).toBe(
        "bg-orange-100 text-orange-700 border-orange-200"
      );
    });

    it("should return green classes for 3+ days later", () => {
      expect(getRemainingDaysColor("2026-02-05T23:59:00")).toBe(
        "bg-green-100 text-green-700 border-green-200"
      );
    });
  });
});
