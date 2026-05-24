import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return client;
}

export const MODELS = {
  brain: "claude-sonnet-4-6",
  chat: "claude-haiku-4-5-20251001",
} as const;

export const CHAT_CONFIG = {
  maxTokens: 800,
  temperature: 0.4,
  maxHistoryMessages: 10,
} as const;
