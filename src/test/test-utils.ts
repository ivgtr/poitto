import { LlmConfig } from "@/lib/local-storage";

/**
 * テスト用のLlmConfigを生成
 */
export function createTestLlmConfig(overrides?: Partial<LlmConfig>): LlmConfig {
  return {
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "test-api-key",
    useCustomModel: false,
    ...overrides,
  };
}

/**
 * テスト用のOpenRouter設定を生成
 */
export function createTestOpenRouterConfig(overrides?: Partial<LlmConfig>): LlmConfig {
  return {
    provider: "openrouter",
    model: "openai/gpt-4o-mini",
    apiKey: "test-api-key",
    useCustomModel: false,
    ...overrides,
  };
}
