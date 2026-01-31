"use client";

const API_KEY_KEY = "poitto_api_key";
const PROVIDER_KEY = "poitto_llm_provider";
const MODEL_KEY = "poitto_llm_model";
const USE_CUSTOM_MODEL_KEY = "poitto_use_custom_model";

export type LlmProvider = "openai" | "openrouter";

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  apiKey: string;
  useCustomModel: boolean;
}

export const OPENROUTER_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "anthropic" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", provider: "google" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", provider: "meta" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", provider: "deepseek" },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", provider: "qwen" },
];

export const OPENAI_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
];

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_KEY);
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_KEY, key);
}

export function removeApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_KEY);
}

export function getLlmProvider(): LlmProvider {
  if (typeof window === "undefined") return "openrouter";
  const provider = localStorage.getItem(PROVIDER_KEY) as LlmProvider;
  return provider === "openai" ? "openai" : "openrouter";
}

export function setLlmProvider(provider: LlmProvider): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROVIDER_KEY, provider);
}

export function getLlmModel(): string {
  if (typeof window === "undefined") return "openai/gpt-4o-mini";
  const model = localStorage.getItem(MODEL_KEY);
  if (model) return model;
  
  // デフォルト値
  const provider = getLlmProvider();
  return provider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini";
}

export function setLlmModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODEL_KEY, model);
}

export function getUseCustomModel(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(USE_CUSTOM_MODEL_KEY) === "true";
}

export function setUseCustomModel(useCustom: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USE_CUSTOM_MODEL_KEY, useCustom ? "true" : "false");
}

export function getLlmConfig(): LlmConfig | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  
  return {
    provider: getLlmProvider(),
    model: getLlmModel(),
    apiKey,
    useCustomModel: getUseCustomModel(),
  };
}
