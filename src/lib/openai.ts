import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }
  return client;
}

export const IMAGE_MODEL = "gpt-image-1" as const;

export const IMAGE_CONFIG = {
  size: "1024x1024" as const,
  quality: "high" as const,
} as const;
