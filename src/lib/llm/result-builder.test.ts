import { describe, it, expect, vi } from "vitest";
import { buildTaskInfoFromLlmResponse, buildParseResult, createFallbackResult, parseScheduledDate, parseScheduledTime } from "./result-builder";

const mockCreate = vi.fn();
vi.mock("openai", () => ({
  default: vi.fn(() => ({
    chat: { completions: { create: (...args: unknown[]) => mockCreate(...args) } }
  }))
}));

describe("result-builder", () => {
  describe("createFallbackResult", () => {
    it("should create fallback result with input as title", () => {
      const result = createFallbackResult("テスト入力");

      expect(result.taskInfo.title).toBe("テスト入力");
      expect(result.taskInfo.category).toBe("personal");
      expect(result.isComplete).toBe(true);
      expect(result.clarificationOptions).toContain("登録する");
    });
  });

  describe("buildTaskInfoFromLlmResponse", () => {
    it("should parse valid LLM response", () => {
      const parsed = {
        title: "会議",
        category: "work",
        scheduledDate: "2026-02-02",
        scheduledTime: "14:00",
        deadline: "2026-02-02T23:59:00+09:00",
        durationMinutes: 60,
      };

      const taskInfo = buildTaskInfoFromLlmResponse(parsed, "元の入力");

      expect(taskInfo.title).toBe("会議");
      expect(taskInfo.category).toBe("work");
      expect(taskInfo.scheduledDate).toBe("2026-02-02");
      expect(taskInfo.scheduledTime).toBe("14:00");
      expect(taskInfo.durationMinutes).toBe(60);
    });

    it("should use input as fallback when title is empty", () => {
      const parsed = {
        title: "",
        category: null,
      };

      const taskInfo = buildTaskInfoFromLlmResponse(parsed, "元の入力");

      expect(taskInfo.title).toBe("元の入力");
    });

    it("should handle null scheduledTime", () => {
      const parsed = {
        title: "タスク",
        scheduledTime: "null",
      };

      const taskInfo = buildTaskInfoFromLlmResponse(parsed, "入力");

      expect(taskInfo.scheduledTime).toBeNull();
    });
  });

  describe("parseScheduledDate", () => {
    it("should parse YMD format", () => {
      const result = parseScheduledDate({ scheduledDate: "2026-02-02" });
      expect(result).toBe("2026-02-02");
    });

    it("should return null for invalid format", () => {
      const result = parseScheduledDate({ scheduledDate: "invalid" });
      expect(result).toBeNull();
    });
  });

  describe("parseScheduledTime", () => {
    it("should parse HH:mm format", () => {
      const result = parseScheduledTime({ scheduledTime: "14:30" });
      expect(result).toBe("14:30");
    });

    it("should parse time slot", () => {
      const result = parseScheduledTime({ scheduledTime: "morning" });
      expect(result).toBe("morning");
    });

    it("should return null for null string", () => {
      const result = parseScheduledTime({ scheduledTime: "null" });
      expect(result).toBeNull();
    });
  });

  describe("buildParseResult", () => {
    it("should identify missing required fields", () => {
      const taskInfo = {
        title: "タスク",
        category: null,
        deadline: null,
        scheduledDate: null,
        scheduledTime: null,
        durationMinutes: null,
      };

      const result = buildParseResult(taskInfo, "入力");

      expect(result.missingFields).toContain("category");
      expect(result.isComplete).toBe(false);
    });

    it("should mark complete when all required fields present", () => {
      const taskInfo = {
        title: "タスク",
        category: "work",
        deadline: null,
        scheduledDate: null,
        scheduledTime: null,
        durationMinutes: null,
      };

      const result = buildParseResult(taskInfo, "入力");

      expect(result.missingFields).toHaveLength(0);
      expect(result.isComplete).toBe(true);
    });
  });
});
