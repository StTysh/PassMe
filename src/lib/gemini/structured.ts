import { z } from "zod";

import { GEMINI_DEFAULT_MODEL } from "@/lib/gemini/models";
import { generateGeminiText, type GeminiTextResult } from "@/lib/gemini/text";
import type { PromptDefinition } from "@/lib/prompts/shared";

export interface GeminiStructuredRequest<TSchema extends z.ZodTypeAny> {
  prompt: string;
  schema: TSchema;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  retryOnce?: boolean;
}

export type GeminiStructuredSuccess<TValue> = {
  ok: true;
  value: TValue;
  rawText: string;
  model: string;
  attempts: 1 | 2;
};

export type GeminiStructuredFailureReason =
  | "missing_api_key"
  | "sdk_error"
  | "invalid_json"
  | "schema_validation_failed";

export type GeminiStructuredFailure = {
  ok: false;
  reason: GeminiStructuredFailureReason;
  message: string;
  rawText?: string;
  issues?: string[];
  error?: unknown;
  attempts: 1 | 2;
};

export type GeminiStructuredResult<TValue> =
  | GeminiStructuredSuccess<TValue>
  | GeminiStructuredFailure;

function extractJsonCandidate(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text.trim();
}

function parseJsonCandidate<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  text: string,
) {
  try {
    const json = JSON.parse(extractJsonCandidate(text));
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false as const,
        reason: "schema_validation_failed" as const,
        issues: parsed.error.issues.map((issue) => issue.message),
      };
    }

    return { ok: true as const, value: parsed.data };
  } catch (error) {
    return {
      ok: false as const,
      reason: "invalid_json" as const,
      error,
    };
  }
}

function buildRetryInstruction(systemInstruction?: string) {
  return [
    systemInstruction?.trim(),
    "Your previous answer was invalid or mismatched the schema.",
    "Return valid JSON only.",
    "Do not add markdown fences, explanations, or commentary.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function generateGeminiStructured<TSchema extends z.ZodTypeAny>(
  request: GeminiStructuredRequest<TSchema>,
): Promise<GeminiStructuredResult<z.infer<TSchema>>> {
  const model = request.model ?? GEMINI_DEFAULT_MODEL;
  const attempts: Array<{ systemInstruction?: string }> = [
    { systemInstruction: request.systemInstruction },
  ];

  if (request.retryOnce !== false) {
    attempts.push({ systemInstruction: buildRetryInstruction(request.systemInstruction) });
  }

  let lastFailure: GeminiStructuredFailure | null = null;

  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
    const attempt = attempts[attemptIndex];
    const textResult: GeminiTextResult = await generateGeminiText({
      prompt: request.prompt,
      systemInstruction: attempt.systemInstruction,
      model,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
    });

    if (!textResult.ok) {
      lastFailure = {
        ok: false,
        reason:
          textResult.reason === "missing_api_key"
            ? "missing_api_key"
            : "sdk_error",
        message: textResult.message,
        error: textResult.error,
        attempts: (attemptIndex + 1) as 1 | 2,
      };
      if (textResult.reason === "missing_api_key") {
        return lastFailure;
      }
      continue;
    }

    const parsed = parseJsonCandidate(request.schema, textResult.text);
    if (parsed.ok) {
      return {
        ok: true,
        value: parsed.value,
        rawText: textResult.text,
        model,
        attempts: (attemptIndex + 1) as 1 | 2,
      };
    }

    lastFailure = {
      ok: false,
      reason: parsed.reason,
      message:
        parsed.reason === "invalid_json"
          ? "Gemini returned invalid JSON."
          : "Gemini returned JSON that did not match the expected schema.",
      rawText: textResult.text,
      issues: parsed.issues,
      error: parsed.error,
      attempts: (attemptIndex + 1) as 1 | 2,
    };
  }

  if (lastFailure) {
    return lastFailure;
  }

  return {
    ok: false,
    reason: "sdk_error",
    message: "Gemini structured generation failed.",
    attempts: 2,
  };
}

export async function generateStructured<T>({
  prompt,
  schema,
  fallback,
}: {
  prompt: string | PromptDefinition;
  schema: z.ZodType<T>;
  fallback: () => T;
}) {
  const result = await generateGeminiStructured({
    prompt: typeof prompt === "string" ? prompt : prompt.userPrompt,
    schema,
    systemInstruction: typeof prompt === "string" ? undefined : prompt.systemInstruction,
    model: undefined,
    temperature: typeof prompt === "string" ? undefined : prompt.temperature,
    maxOutputTokens: typeof prompt === "string" ? undefined : prompt.maxOutputTokens,
  });

  return result.ok ? result.value : fallback();
}
