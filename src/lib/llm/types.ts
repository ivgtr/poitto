/**
 * LLMパーサーの型定義
 */

export interface LlmParserConfig {
  provider: "openai" | "openrouter";
  model: string;
  apiKey: string;
}
