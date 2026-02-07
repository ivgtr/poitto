import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMessageSender } from "./use-message-sender";
import * as conversationService from "@/services/task-conversation-service";

vi.mock("@/services/task-conversation-service", () => ({
  generateNextQuestion: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useMessageSender", () => {
  const mockDeps = {
    addUserMessage: vi.fn(),
    addAssistantMessage: vi.fn(),
    addSystemMessage: vi.fn(),
    processInput: vi.fn(),
    setIsLoading: vi.fn(),
    setIsFirstInput: vi.fn(),
    setCurrentField: vi.fn(),
    pendingTaskInfo: { current: null },
    conversation: {
      currentField: null,
      currentTaskInfo: {},
    },
    isFirstInput: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps.pendingTaskInfo.current = null;
  });

  it("should add user message and process input", async () => {
    const { result } = renderHook(() => useMessageSender(mockDeps));
    
    mockDeps.processInput.mockResolvedValueOnce({
      result: {
        taskInfo: {
          title: "テストタスク",
          category: "work",
          deadline: null,
          scheduledDate: null,
          scheduledTime: null,
          durationMinutes: null,
        },
        missingFields: [],
        nextQuestion: null,
        clarificationOptions: [],
        isComplete: true,
        rawInput: "テスト",
        conversationContext: "テスト",
      },
      isComplete: true,
    });

    (conversationService.generateNextQuestion as ReturnType<typeof vi.fn>).mockReturnValue({
      field: null,
      question: "",
      options: [],
      hasMoreOptions: false,
    });

    const config = {
      provider: "openai" as const,
      model: "gpt-4",
      apiKey: "test-key",
      useCustomModel: false,
    };

    await result.current.handleSendMessage("テストメッセージ", config);

    expect(mockDeps.addUserMessage).toHaveBeenCalledWith("テストメッセージ");
    expect(mockDeps.processInput).toHaveBeenCalledWith("テストメッセージ", config);
    expect(mockDeps.setIsLoading).toHaveBeenCalledWith(true);
    expect(mockDeps.setIsLoading).toHaveBeenCalledWith(false);
  });

  it("should update isFirstInput flag on first message", async () => {
    const { result } = renderHook(() => useMessageSender(mockDeps));
    
    mockDeps.processInput.mockResolvedValueOnce({
      result: {
        taskInfo: {
          title: "タスク",
          category: null,
          deadline: null,
          scheduledDate: null,
          scheduledTime: null,
          durationMinutes: null,
        },
        missingFields: ["category"],
        nextQuestion: "カテゴリを選んでください",
        clarificationOptions: [],
        isComplete: false,
        rawInput: "タスク",
        conversationContext: "タスク",
      },
      isComplete: false,
    });

    (conversationService.generateNextQuestion as ReturnType<typeof vi.fn>).mockReturnValue({
      field: "category",
      question: "カテゴリを選んでください",
      options: ["買い物", "仕事", "個人"],
      hasMoreOptions: false,
    });

    const config = {
      provider: "openai" as const,
      model: "gpt-4",
      apiKey: "test-key",
      useCustomModel: false,
    };

    await result.current.handleSendMessage("タスク", config);

    expect(mockDeps.setIsFirstInput).toHaveBeenCalledWith(false);
  });
});
