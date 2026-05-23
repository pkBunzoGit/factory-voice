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
  brain: "claude-sonnet-4-20250514",
  chat: "claude-3-5-haiku-20241022",
} as const;

export const CHAT_CONFIG = {
  maxTokens: 400,
  temperature: 0.4,
  maxHistoryMessages: 10,
} as const;
