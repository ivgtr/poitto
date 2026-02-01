import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTaskRegistration } from "./use-task-registration";
import * as conversationService from "@/services/task-conversation-service";
import * as taskService from "@/services/task-service";
import { TaskInfo } from "@/domain/task/task-fields";
import { Task } from "@/types/task";
import { MessageType, SystemMessageType } from "./types";

vi.mock("@/services/task-conversation-service", () => ({
  mapSelectionToField: vi.fn(),
  generateNextQuestion: vi.fn(),
  canRegisterTask: vi.fn(),
}));

vi.mock("@/services/task-service", () => ({
  taskService: {
    create: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useTaskRegistration", () => {
  const mockDeps = {
    userId: "user-123",
    addAssistantMessage: vi.fn<(data: {
      content: string;
      type: MessageType;
      taskInfo?: TaskInfo;
      options?: string[];
      isComplete?: boolean;
    }) => void>(),
    addSystemMessage: vi.fn<(content: string, type: SystemMessageType) => void>(),
    updateField: vi.fn<(field: keyof TaskInfo, value: TaskInfo[keyof TaskInfo]) => void>(),
    setCurrentField: vi.fn<(field: string | null) => void>(),
    reset: vi.fn<() => void>(),
    onTaskCreated: vi.fn<(task: Task) => void>(),
    pendingTaskInfo: { current: null as TaskInfo | null },
    conversation: {
      currentField: null as string | null,
      currentTaskInfo: {} as Partial<TaskInfo>,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps.pendingTaskInfo.current = null;
  });

  it("should handle cancel action", async () => {
    const { result } = renderHook(() => useTaskRegistration(mockDeps));

    const selectResult = await result.current.handleSelectOption("登録しない");

    expect(mockDeps.addSystemMessage).toHaveBeenCalledWith(
      "タスクの登録をキャンセルしました。",
      "cancelled"
    );
    expect(selectResult).toEqual({ type: "cancelled" });
  });

  it("should handle register anyway action with validation", async () => {
    const { result } = renderHook(() => useTaskRegistration(mockDeps));

    (conversationService.mapSelectionToField as ReturnType<typeof vi.fn>).mockReturnValue({
      success: false,
      action: "register_anyway",
    });

    mockDeps.pendingTaskInfo.current = {
      title: "テストタスク",
      category: "work",
      deadline: null,
      scheduledDate: null,
      scheduledTime: null,
      durationMinutes: null,
    };

    (taskService.taskService.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "task-123",
      title: "テストタスク",
      category: "work",
    });

    const selectResult = await result.current.handleSelectOption("とりあえず登録");

    expect(taskService.taskService.create).toHaveBeenCalled();
    expect(selectResult.type).toBe("registered");
  });

  it("should handle successful field mapping", async () => {
    const depsWithTaskInfo = {
      ...mockDeps,
      conversation: {
        currentField: "category",
        currentTaskInfo: {
          title: "テストタスク",
          category: null,
          deadline: null,
          scheduledDate: null,
          scheduledTime: null,
          durationMinutes: null,
        },
      },
    };
    const { result } = renderHook(() => useTaskRegistration(depsWithTaskInfo));

    (conversationService.mapSelectionToField as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      field: "category",
      value: "work",
      nextField: "deadline",
    });

    (conversationService.generateNextQuestion as ReturnType<typeof vi.fn>).mockReturnValue({
      field: "deadline",
      question: "いつまでに完了させますか？",
      options: ["今日", "明日", "今週中"],
      hasMoreOptions: false,
    });

    const selectResult = await result.current.handleSelectOption("仕事");

    expect(depsWithTaskInfo.updateField).toHaveBeenCalledWith("category", "work");
    expect(selectResult.type).toBe("continue");
  });

  it("should handle invalid mapping as send_message", async () => {
    const { result } = renderHook(() => useTaskRegistration(mockDeps));

    (conversationService.mapSelectionToField as ReturnType<typeof vi.fn>).mockReturnValue({
      success: false,
      field: null,
      value: null,
      nextField: null,
    });

    const selectResult = await result.current.handleSelectOption("無効な選択肢");

    expect(selectResult).toEqual({ type: "send_message", message: "無効な選択肢" });
  });
});
