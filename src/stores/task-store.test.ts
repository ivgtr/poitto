import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTaskStore, CreateTaskData, TaskWithMeta } from "./task-store";
import { Task, Category, TaskStatus } from "@/types/task";
import { AppError, ErrorCode } from "@/lib/errors";
import * as actions from "@/actions/tasks";
import { act } from "@testing-library/react";

// Mock the actions
vi.mock("@/actions/tasks", () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskStatus: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("useTaskStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useTaskStore.getState();
    store.initializeTasks([]);
    store.clearError();
    store.clearUndo();
    vi.clearAllMocks();
  });

  describe("initializeTasks", () => {
    it("should initialize tasks with metadata", () => {
      const mockTasks: Task[] = [
        {
          id: "1",
          userId: "user1",
          title: "Test Task",
          category: "work" as Category,
          deadline: null,
          scheduledDate: null,
          scheduledAt: null,
          durationMinutes: null,
          status: "inbox" as TaskStatus,
          completedAt: null,
          rawInput: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      act(() => {
        useTaskStore.getState().initializeTasks(mockTasks);
      });

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0]._syncStatus).toBe("synced");
      expect(state.tasks[0]._localTimestamp).toBeGreaterThan(0);
      expect(state.lastServerSync).toBeGreaterThan(0);
    });
  });

  describe("fetchTasks", () => {
    it("should fetch tasks from server", async () => {
      const mockTasks: Task[] = [
        {
          id: "1",
          userId: "user1",
          title: "Server Task",
          category: "work" as Category,
          deadline: null,
          scheduledAt: null,
          durationMinutes: null,
          status: "inbox" as TaskStatus,
          completedAt: null,
          rawInput: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(actions.getTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
      });

      await act(async () => {
        await useTaskStore.getState().fetchTasks("user1", true);
      });

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe("Server Task");
      expect(state.isLoading).toBe(false);
    });

    it("should use cache if within 5 minutes", async () => {
      const mockTasks: Task[] = [
        {
          id: "1",
          userId: "user1",
          title: "Cached Task",
          category: "work" as Category,
          deadline: null,
          scheduledAt: null,
          durationMinutes: null,
          status: "inbox" as TaskStatus,
          completedAt: null,
          rawInput: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Initialize with tasks
      act(() => {
        useTaskStore.getState().initializeTasks(mockTasks);
      });

      vi.mocked(actions.getTasks).mockResolvedValue({
        success: true,
        data: [],
      });

      // Fetch without force - should use cache
      await act(async () => {
        await useTaskStore.getState().fetchTasks("user1", false);
      });

      const state = useTaskStore.getState();
      // Should still have the cached task
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe("Cached Task");
    });
  });

  describe("createTask (optimistic update)", () => {
    it("should optimistically add task before server response", async () => {
      const data: CreateTaskData = {
        title: "New Task",
        category: "work",
      };

      const serverTask: Task = {
        id: "server-1",
        userId: "user1",
        title: "New Task",
        category: "work" as Category,
        deadline: null,
        scheduledAt: null,
        durationMinutes: null,
        status: "inbox" as TaskStatus,
        completedAt: null,
        rawInput: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Delay server response
      vi.mocked(actions.createTask).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, data: serverTask });
            }, 100);
          })
      );

      // Start creation
      const createPromise = act(async () => {
        await useTaskStore.getState().createTask("user1", data);
      });

      // Immediately check - should have optimistic task
      const state1 = useTaskStore.getState();
      expect(state1.tasks).toHaveLength(1);
      expect(state1.tasks[0].title).toBe("New Task");
      expect(state1.tasks[0]._syncStatus).toBe("pending");
      expect(state1.tasks[0].id).toMatch(/^temp-/);

      // Wait for completion
      await createPromise;

      // Should be replaced with server task
      const state2 = useTaskStore.getState();
      expect(state2.tasks).toHaveLength(1);
      expect(state2.tasks[0].id).toBe("server-1");
      expect(state2.tasks[0]._syncStatus).toBe("synced");
    });

    it("should mark task as conflict on failure", async () => {
      const data: CreateTaskData = {
        title: "Failing Task",
        category: "work",
      };

      const error: AppError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: "Failed",
        userMessage: "Failed",
      };

      vi.mocked(actions.createTask).mockResolvedValue({
        success: false,
        error,
      });

      await act(async () => {
        await useTaskStore.getState().createTask("user1", data);
      });

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0]._syncStatus).toBe("conflict");
    });
  });

  describe("updateTask (optimistic update)", () => {
    it("should optimistically update task", async () => {
      const existingTask: TaskWithMeta = {
        id: "1",
        userId: "user1",
        title: "Old Title",
        category: "work" as Category,
        deadline: null,
        scheduledAt: null,
        durationMinutes: null,
        status: "inbox" as TaskStatus,
        completedAt: null,
        rawInput: null,
        createdAt: new Date(),
        updatedAt: new Date(Date.now() - 1000),
        _syncStatus: "synced",
        _localTimestamp: Date.now() - 1000,
      };

      act(() => {
        useTaskStore.setState({ tasks: [existingTask] });
      });

      const updatedTask: Task = {
        ...existingTask,
        title: "New Title",
        updatedAt: new Date(),
      };

      vi.mocked(actions.updateTask).mockResolvedValue({
        success: true,
        data: updatedTask,
      });

      await act(async () => {
        await useTaskStore.getState().updateTask("1", { title: "New Title" });
      });

      const state = useTaskStore.getState();
      expect(state.tasks[0].title).toBe("New Title");
      expect(state.tasks[0]._syncStatus).toBe("synced");
    });
  });

  describe("completeTask", () => {
    it("should mark task as done optimistically", async () => {
      const existingTask: TaskWithMeta = {
        id: "1",
        userId: "user1",
        title: "Task to Complete",
        category: "work" as Category,
        deadline: null,
        scheduledAt: null,
        durationMinutes: null,
        status: "inbox" as TaskStatus,
        completedAt: null,
        rawInput: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _syncStatus: "synced",
        _localTimestamp: Date.now(),
      };

      act(() => {
        useTaskStore.setState({ tasks: [existingTask] });
      });

      vi.mocked(actions.updateTaskStatus).mockResolvedValue({
        success: true,
        data: { ...existingTask, status: "done" as TaskStatus, completedAt: new Date() },
      });

      await act(async () => {
        await useTaskStore.getState().completeTask("1");
      });

      const state = useTaskStore.getState();
      expect(state.tasks[0].status).toBe("done");
      expect(state.tasks[0].completedAt).not.toBeNull();
    });
  });

  describe("selectors", () => {
    it("should filter active tasks correctly", () => {
      const tasks: TaskWithMeta[] = [
        {
          id: "1",
          userId: "user1",
          title: "Inbox Task",
          category: "work" as Category,
          deadline: null,
          scheduledAt: null,
          durationMinutes: null,
          status: "inbox" as TaskStatus,
          completedAt: null,
          rawInput: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _syncStatus: "synced",
          _localTimestamp: Date.now(),
        },
        {
          id: "2",
          userId: "user1",
          title: "Scheduled Task",
          category: "work" as Category,
          deadline: null,
          scheduledAt: new Date(),
          durationMinutes: null,
          status: "scheduled" as TaskStatus,
          completedAt: null,
          rawInput: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _syncStatus: "synced",
          _localTimestamp: Date.now(),
        },
        {
          id: "3",
          userId: "user1",
          title: "Done Task",
          category: "work" as Category,
          deadline: null,
          scheduledAt: null,
          durationMinutes: null,
          status: "done" as TaskStatus,
          completedAt: new Date(),
          rawInput: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _syncStatus: "synced",
          _localTimestamp: Date.now(),
        },
      ];

      act(() => {
        useTaskStore.setState({ tasks });
      });

      // Use selector functions directly
      const state = useTaskStore.getState();
      const activeTasks = state.tasks.filter(
        (t) => t.status === "inbox" || t.status === "scheduled"
      );
      const completedTasks = state.tasks.filter((t) => t.status === "done");

      expect(activeTasks).toHaveLength(2);
      expect(completedTasks).toHaveLength(1);
    });
  });

  describe("undo infrastructure", () => {
    it("should clear undo state and timeout", () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      const previousTask: TaskWithMeta = {
        id: "1",
        userId: "user1",
        title: "Original",
        category: "work" as Category,
        deadline: null,
        scheduledAt: null,
        durationMinutes: null,
        status: "inbox" as TaskStatus,
        completedAt: null,
        rawInput: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _syncStatus: "synced",
        _localTimestamp: Date.now(),
      };

      const timeoutId = setTimeout(() => {}, 5000);

      act(() => {
        useTaskStore.setState({
          undoState: {
            taskId: "1",
            operation: "update",
            previousTask,
            timeoutId,
          },
        });
      });

      act(() => {
        useTaskStore.getState().clearUndo();
      });

      const state = useTaskStore.getState();
      expect(state.undoState).toBeNull();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    });

    it("should restore previous task on undo", async () => {
      vi.useFakeTimers();
      const previousTaskData: Task = {
        id: "1",
        userId: "user1",
        title: "Original",
        category: "work" as Category,
        deadline: null,
        scheduledAt: null,
        durationMinutes: null,
        status: "inbox" as TaskStatus,
        completedAt: null,
        rawInput: null,
        createdAt: new Date(),
        updatedAt: new Date(Date.now() - 1000),
      };

      const previousTask: TaskWithMeta = {
        ...previousTaskData,
        _syncStatus: "synced",
        _localTimestamp: Date.now() - 1000,
      };

      const modifiedTask: TaskWithMeta = {
        ...previousTask,
        title: "Modified",
        updatedAt: new Date(),
        _syncStatus: "pending",
      };

      const timeoutId = setTimeout(() => {}, 5000);

      vi.mocked(actions.updateTask).mockResolvedValue({
        success: true,
        data: previousTaskData,
      });

      act(() => {
        useTaskStore.setState({
          tasks: [modifiedTask],
          undoState: {
            taskId: "1",
            operation: "update",
            previousTask,
            timeoutId,
          },
        });
      });

      await act(async () => {
        await useTaskStore.getState().undo();
      });

      const state = useTaskStore.getState();
      expect(state.tasks[0].title).toBe("Original");
      expect(state.undoState).toBeNull();

      vi.useRealTimers();
    });

    it("should restore previous status on complete undo", async () => {
      vi.useFakeTimers();
      const previousTaskData: Task = {
        id: "2",
        userId: "user1",
        title: "Complete Target",
        category: "work" as Category,
        deadline: null,
        scheduledAt: null,
        durationMinutes: null,
        status: "inbox" as TaskStatus,
        completedAt: null,
        rawInput: null,
        createdAt: new Date(),
        updatedAt: new Date(Date.now() - 1000),
      };

      const previousTask: TaskWithMeta = {
        ...previousTaskData,
        _syncStatus: "synced",
        _localTimestamp: Date.now() - 1000,
      };

      const completedTask: TaskWithMeta = {
        ...previousTask,
        status: "done" as TaskStatus,
        completedAt: new Date(),
        _syncStatus: "pending",
      };

      const timeoutId = setTimeout(() => {}, 5000);

      vi.mocked(actions.updateTaskStatus).mockResolvedValue({
        success: true,
        data: previousTaskData,
      });

      act(() => {
        useTaskStore.setState({
          tasks: [completedTask],
          undoState: {
            taskId: "2",
            operation: "complete",
            previousTask,
            timeoutId,
          },
        });
      });

      await act(async () => {
        await useTaskStore.getState().undo();
      });

      const state = useTaskStore.getState();
      expect(state.tasks[0].status).toBe("inbox");
      expect(state.undoState).toBeNull();

      vi.useRealTimers();
    });
  });
});
