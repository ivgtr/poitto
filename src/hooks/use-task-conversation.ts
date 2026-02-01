import { useState, useCallback } from "react";
import { ApiResponseSchema, ParseResult, toTaskInfo } from "@/types/chat";
import { TaskInfo } from "@/domain/task/task-fields";
import { LlmConfig } from "@/lib/local-storage";

export type ConversationPhase = 
  | "initial"
  | "collecting"
  | "confirming"
  | "completed"
  | "cancelled";

interface ConversationState {
  phase: ConversationPhase;
  currentTaskInfo: Partial<TaskInfo>;
  context: string;
  currentField: string | null;
}

interface UseTaskConversationReturn {
  state: ConversationState;
  isActive: boolean;
  startConversation: () => void;
  updateField: (field: keyof TaskInfo, value: TaskInfo[keyof TaskInfo]) => void;
  setCurrentField: (field: string | null) => void;
  processInput: (
    input: string,
    config: LlmConfig
  ) => Promise<{
    result: ParseResult | null;
    nextField: string | null;
    isComplete: boolean;
  }>;
  confirmRegistration: () => TaskInfo | null;
  reset: () => void;
}

const INITIAL_STATE: ConversationState = {
  phase: "initial",
  currentTaskInfo: {},
  context: "",
  currentField: null,
};

async function fetchParseTask(
  input: string,
  config: LlmConfig,
  previousContext: string,
  currentTaskInfo: Partial<TaskInfo>
): Promise<ParseResult> {
  const response = await fetch("/api/parse-task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      config,
      previousContext,
      currentTaskInfo,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to parse task");
  }

  const json = await response.json();
  
  // Validate API response with Zod
  const parsedResponse = ApiResponseSchema.safeParse(json);
  if (!parsedResponse.success) {
    console.error("API response validation failed:", parsedResponse.error);
    throw new Error("Invalid API response format");
  }
  
  if (!parsedResponse.data.success || !parsedResponse.data.data) {
    throw new Error(parsedResponse.data.error?.userMessage || "API returned error");
  }
  
  return parsedResponse.data.data;
}

export function useTaskConversation(): UseTaskConversationReturn {
  const [state, setState] = useState<ConversationState>(INITIAL_STATE);

  const startConversation = useCallback(() => {
    setState({
      ...INITIAL_STATE,
      phase: "collecting",
    });
  }, []);

  const updateField = useCallback((field: keyof TaskInfo, value: TaskInfo[keyof TaskInfo]) => {
    setState((prev) => ({
      ...prev,
      currentTaskInfo: {
        ...prev.currentTaskInfo,
        [field]: value,
      },
    }));
  }, []);

  const setCurrentField = useCallback((field: string | null) => {
    setState((prev) => ({
      ...prev,
      currentField: field,
    }));
  }, []);

  const processInput = useCallback(async (
    input: string,
    config: LlmConfig
  ): Promise<{
    result: ParseResult | null;
    nextField: string | null;
    isComplete: boolean;
  }> => {
    try {
      // API経由で解析
      const result = await fetchParseTask(
        input,
        config,
        state.context,
        state.currentTaskInfo
      );

      console.log("[Client] API Result:", result);

      setState((prev) => ({
        ...prev,
        phase: "collecting",
        currentTaskInfo: result.taskInfo,
        context: result.conversationContext,
      }));

      return {
        result,
        nextField: result.missingFields[0] || null,
        isComplete: result.isComplete && result.missingFields.length === 0,
      };
    } catch (error) {
      console.error("[Client] API Error:", error);
      return {
        result: null,
        nextField: null,
        isComplete: false,
      };
    }
  }, [state.context, state.currentTaskInfo]);

  const confirmRegistration = useCallback((): TaskInfo | null => {
    const { currentTaskInfo } = state;
    
    if (!currentTaskInfo.title || !currentTaskInfo.category) {
      return null;
    }

    const taskInfo = toTaskInfo({ ...currentTaskInfo });

    setState((prev) => ({
      ...prev,
      phase: "completed",
      currentTaskInfo: {},
      context: "",
      currentField: null,
    }));

    return taskInfo;
  }, [state]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    isActive: state.phase !== "initial" && state.phase !== "completed" && state.phase !== "cancelled",
    startConversation,
    updateField,
    setCurrentField,
    processInput,
    confirmRegistration,
    reset,
  };
}
