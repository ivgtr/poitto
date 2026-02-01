import { z } from "zod";

/**
 * TaskInfoのZodスキーマ
 * ランタイム検証と型安全を両立
 */
export const TaskInfoSchema = z.object({
  title: z.string().nullable(),
  category: z.enum(["shopping", "reply", "work", "personal", "other"]).nullable(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/).nullable(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  scheduledTime: z.union([
    z.string().regex(/^\d{2}:\d{2}$/), // HH:mm形式
    z.enum(["morning", "noon", "afternoon", "evening"]), // 時間帯
    z.null(),
  ]),
  durationMinutes: z.number().int().positive().nullable(),
});

export type TaskInfo = z.infer<typeof TaskInfoSchema>;

/**
 * フィールドマッピング結果のスキーマ
 */
export const FieldMappingResultSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    value: z.union([z.string(), z.number(), z.null()]),
  }),
  z.object({
    success: z.literal(false),
    value: z.null(),
  }),
]);

export type FieldMappingResult = z.infer<typeof FieldMappingResultSchema>;

/**
 * 特定フィールド用の厳密なマッピング結果スキーマ
 */
export const CategoryMappingSchema = z.object({
  success: z.literal(true),
  value: z.enum(["shopping", "reply", "work", "personal", "other"]),
});

export const DateMappingSchema = z.object({
  success: z.literal(true),
  value: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const TimeMappingSchema = z.object({
  success: z.literal(true),
  value: z.union([
    z.string().regex(/^\d{2}:\d{2}$/),
    z.enum(["morning", "noon", "afternoon", "evening"]),
  ]),
});

export const DurationMappingSchema = z.object({
  success: z.literal(true),
  value: z.number().int().positive(),
});

/**
 * スキーマ検証ユーティリティ
 */
export function validateTaskInfo(data: unknown): TaskInfo | null {
  const result = TaskInfoSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function validateFieldMapping(data: unknown): FieldMappingResult | null {
  const result = FieldMappingResultSchema.safeParse(data);
  return result.success ? result.data : null;
}
