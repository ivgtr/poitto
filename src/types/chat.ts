import { z } from "zod";

// TaskInfo schema
export const TaskInfoSchema = z.object({
  title: z.string().nullable(),
  category: z.string().nullable(),
  deadline: z.string().nullable(),
  scheduledAt: z.string().nullable(),
  durationMinutes: z.number().nullable(),
});

export type TaskInfo = z.infer<typeof TaskInfoSchema>;

// ParseResult schema for API response
export const ParseResultSchema = z.object({
  taskInfo: TaskInfoSchema,
  missingFields: z.array(z.string()),
  nextQuestion: z.string().nullable(),
  clarificationOptions: z.array(z.string()),
  isComplete: z.boolean(),
  rawInput: z.string(),
  conversationContext: z.string(),
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

// API Response wrapper schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: ParseResultSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      userMessage: z.string(),
      details: z.string().optional(),
    })
    .optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Chat message schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  type: z
    .enum(["initial", "question", "confirmation", "complete", "cancelled"])
    .optional(),
  taskInfo: TaskInfoSchema.optional(),
  options: z.array(z.string()).optional(),
  isComplete: z.boolean().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// 型安全な変換関数
export function toTaskInfo(data: unknown): TaskInfo {
  const result = TaskInfoSchema.safeParse(data);
  if (!result.success) {
    console.error("TaskInfo validation failed:", result.error);
    throw new Error("Invalid TaskInfo data");
  }
  return result.data;
}

export function isValidTaskInfo(data: unknown): data is TaskInfo {
  return TaskInfoSchema.safeParse(data).success;
}