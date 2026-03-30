import { GoogleGenAI } from "@google/genai";

import { env, hasGeminiApiKey } from "@/lib/env";

import { GEMINI_DEFAULT_MODEL } from "@/lib/gemini/models";

let cachedClient: GoogleGenAI | null | undefined;

export class GeminiUnavailableError extends Error {
  constructor(message = "Gemini API key is not configured.") {
    super(message);
    this.name = "GeminiUnavailableError";
  }
}

export function isGeminiConfigured() {
  return hasGeminiApiKey;
}

export function getGeminiClient() {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  if (!hasGeminiApiKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  return cachedClient;
}

export function requireGeminiClient() {
  const client = getGeminiClient();
  if (!client) {
    throw new GeminiUnavailableError();
  }

  return client;
}

export function getDefaultGeminiModel() {
  return GEMINI_DEFAULT_MODEL;
}
