import OpenAI from "openai";
import { env, hasOpenAIApiKey } from "@/lib/env";

let cachedClient: OpenAI | null | undefined;

export class OpenAIUnavailableError extends Error {
  constructor(message = "OpenAI API key is not configured.") {
    super(message);
    this.name = "OpenAIUnavailableError";
  }
}

export function isOpenAIConfigured() {
  return hasOpenAIApiKey;
}

export function getOpenAIClient() {
  if (cachedClient !== undefined) return cachedClient;

  if (!hasOpenAIApiKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return cachedClient;
}

export function requireOpenAIClient() {
  const client = getOpenAIClient();
  if (!client) throw new OpenAIUnavailableError();
  return client;
}
