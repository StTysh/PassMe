import type { GenerateContentResponse } from "@google/genai";

import { requireGeminiClient } from "@/lib/gemini/client";
import {
  GEMINI_DEFAULT_MODEL,
  GEMINI_TEXT_RESPONSE_MIME_TYPE,
} from "@/lib/gemini/models";

export interface GeminiTextRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export type GeminiTextFailureReason =
  | "missing_api_key"
  | "sdk_error"
  | "empty_response";

export interface GeminiTextSuccess {
  ok: true;
  text: string;
  rawResponse: GenerateContentResponse;
  model: string;
}

export interface GeminiTextFailure {
  ok: false;
  reason: GeminiTextFailureReason;
  message: string;
  error?: unknown;
}

export type GeminiTextResult = GeminiTextSuccess | GeminiTextFailure;

export async function generateGeminiText(
  request: GeminiTextRequest,
): Promise<GeminiTextResult> {
  try {
    const client = requireGeminiClient();
    const response = await client.models.generateContent({
      model: request.model ?? GEMINI_DEFAULT_MODEL,
      contents: request.prompt,
      config: {
        systemInstruction: request.systemInstruction,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
        responseMimeType: GEMINI_TEXT_RESPONSE_MIME_TYPE,
      },
    });

    const text = response.text?.trim() ?? "";

    if (!text) {
      return {
        ok: false,
        reason: "empty_response",
        message: "Gemini returned an empty response.",
        error: response,
      };
    }

    return {
      ok: true,
      text,
      rawResponse: response,
      model: request.model ?? GEMINI_DEFAULT_MODEL,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "GeminiUnavailableError") {
      return {
        ok: false,
        reason: "missing_api_key",
        message: error.message,
        error,
      };
    }

    return {
      ok: false,
      reason: "sdk_error",
      message:
        error instanceof Error ? error.message : "Gemini request failed unexpectedly.",
      error,
    };
  }
}

export async function generateText({
  prompt,
  fallback,
}: {
  prompt: string;
  fallback: () => string;
}) {
  const result = await generateGeminiText({ prompt });
  return result.ok ? result.text : fallback();
}
