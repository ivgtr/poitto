import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();
vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args)
      }
    };
  }
}));

import { parseFirstInput } from "./first-input";

describe("first-input", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("should parse first input successfully", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            title: "買い物",
            category: "shopping",
            scheduledDate: "2026-02-02",
            scheduledTime: "10:00",
            deadline: null,
            durationMinutes: 30,
          })
        }
      }]
    });

    const config = {
      provider: "openai" as const,
      model: "gpt-4",
      apiKey: "test-key",
      useCustomModel: false,
    };

    const result = await parseFirstInput("明日10時に買い物", config);

    expect(result.taskInfo.title).toBe("買い物");
    expect(result.taskInfo.category).toBe("shopping");
    expect(result.isComplete).toBe(true);
  });

  it("should handle missing fields", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            title: "タスク",
            category: null,
            scheduledDate: null,
            scheduledTime: null,
            deadline: null,
            durationMinutes: null,
          })
        }
      }]
    });

    const config = {
      provider: "openai" as const,
      model: "gpt-4",
      apiKey: "test-key",
      useCustomModel: false,
    };

    const result = await parseFirstInput("タスク", config);

    expect(result.missingFields).toContain("category");
    expect(result.nextQuestion).not.toBeNull();
  });

  it("should parse duration in minutes", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            title: "会議",
            category: "work",
            durationMinutes: 60,
          })
        }
      }]
    });

    const config = {
      provider: "openai" as const,
      model: "gpt-4",
      apiKey: "test-key",
      useCustomModel: false,
    };

    const result = await parseFirstInput("1時間の会議", config);

    expect(result.taskInfo.durationMinutes).toBe(60);
  });
});
