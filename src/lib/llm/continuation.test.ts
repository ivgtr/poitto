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

import { parseContinuation } from "./continuation";

describe("continuation", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("should handle special command '登録しない' locally", async () => {
    const config = {
      provider: "openai" as const,
      model: "gpt-4",
      apiKey: "test-key",
      useCustomModel: false,
    };

    const currentTaskInfo = { 
      title: "タスク", 
      category: "work",
      deadline: null,
      scheduledDate: null,
      scheduledTime: null,
      durationMinutes: null,
    };

    const result = await parseContinuation("登録しない", currentTaskInfo, null, config);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.isComplete).toBe(true);
    expect(result.taskInfo.title).toBe("タスク");
  });

  it("should handle special command 'とりあえず登録' locally", async () => {
    const config = {
      provider: "openai" as const,
      model: "gpt-4",
      apiKey: "test-key",
      useCustomModel: false,
    };

    const currentTaskInfo = { 
      title: "タスク", 
      category: "work",
      deadline: null,
      scheduledDate: null,
      scheduledTime: null,
      durationMinutes: null,
    };

    const result = await parseContinuation("とりあえず登録", currentTaskInfo, null, config);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.isComplete).toBe(true);
  });

  it("should call LLM for additional information", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            title: "会議",
            scheduledDate: "2026-02-02",
            scheduledTime: "14:00",
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

    const currentTaskInfo = { title: "会議", category: "work" };

    const result = await parseContinuation("明日の午後2時", currentTaskInfo, "scheduledDate", config);

    expect(mockCreate).toHaveBeenCalled();
    expect(result.taskInfo.scheduledDate).toBe("2026-02-02");
    expect(result.taskInfo.scheduledTime).toBe("14:00");
  });

  it("should merge with existing task info", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            scheduledDate: "2026-02-02",
            deadline: "2026-02-02T23:59:00+09:00",
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

    const currentTaskInfo = { title: "レポート", category: "work" };

    const result = await parseContinuation("明日までに", currentTaskInfo, "deadline", config);

    expect(result.taskInfo.title).toBe("レポート");
    expect(result.taskInfo.category).toBe("work");
    expect(result.taskInfo.deadline).toBe("2026-02-02T23:59:00+09:00");
  });
});
