import { z, toJSONSchema } from "zod";

import { UpstreamError } from "@/lib/api";
import {
  GEMINI_DEFAULT_MODEL,
  GEMINI_JSON_RESPONSE_MIME_TYPE,
  GEMINI_LITE_MODEL,
} from "@/lib/gemini/models";
import { generateGeminiText, type GeminiTextResult } from "@/lib/gemini/text";
import { getProviderForTask, hasGeminiApiKey, hasOpenAIApiKey } from "@/lib/env";
import { generateOpenAIStructured } from "@/lib/openai/structured";
import type { PromptDefinition } from "@/lib/prompts/shared";

function toGeminiJsonSchema(schema: z.ZodTypeAny): unknown {
  try {
    const jsonSchema = toJSONSchema(schema);
    const raw = jsonSchema as Record<string, unknown>;
    delete raw.$schema;
    return raw;
  } catch (e) {
    console.warn("[Gemini structured] Failed to convert Zod schema to JSON Schema:", e);
    return undefined;
  }
}

export interface GeminiStructuredRequest<TSchema extends z.ZodTypeAny> {
  prompt: string;
  schema: TSchema;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  retryOnce?: boolean;
  useNativeSchema?: boolean;
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

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  const arrayFirst = firstBracket >= 0 && (firstBrace < 0 || firstBracket < firstBrace);
  if (arrayFirst && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1).trim();
  }

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

function isSchemaTooBigError(message: string): boolean {
  return /too many states/i.test(message);
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

  const nativeSchema = request.useNativeSchema !== false
    ? toGeminiJsonSchema(request.schema)
    : undefined;
  let schemaDropped = false;

  let lastFailure: GeminiStructuredFailure | null = null;

  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
    const attempt = attempts[attemptIndex];
    const useSchema = nativeSchema && !schemaDropped ? nativeSchema : undefined;
    const textResult: GeminiTextResult = await generateGeminiText({
      prompt: request.prompt,
      systemInstruction: attempt.systemInstruction,
      model,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      responseMimeType: GEMINI_JSON_RESPONSE_MIME_TYPE,
      responseJsonSchema: useSchema,
    });

    if (!textResult.ok) {
      if (!schemaDropped && nativeSchema && isSchemaTooBigError(textResult.message)) {
        console.warn("[Gemini structured] Schema too complex for native constraint - retrying without it");
        schemaDropped = true;
        attemptIndex -= 1;
        continue;
      }

      console.error("[Gemini structured] text generation failed:", textResult.reason, textResult.message);
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
    console.error("[Gemini structured] attempt", attemptIndex + 1, "failed:", parsed.reason, parsed.issues ?? parsed.error);
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

function resolveGeminiModel(tier?: "default" | "lite"): string {
  if (tier === "lite") return GEMINI_LITE_MODEL;
  return GEMINI_DEFAULT_MODEL;
}

export async function generateStructured<T>({
  prompt,
  schema,
  fallback,
  allowStaticFallback = true,
}: {
  prompt: string | PromptDefinition;
  schema: z.ZodType<T>;
  fallback: () => T;
  allowStaticFallback?: boolean;
}) {
  const def = typeof prompt === "string" ? undefined : prompt;
  const taskName = def?.name ?? "unknown";
  const provider = getProviderForTask(taskName);

  const promptText = def ? def.userPrompt : (prompt as string);
  const oaiRequest = {
    prompt: promptText,
    schema: schema as z.ZodTypeAny,
    schemaName: taskName,
    systemInstruction: def?.systemInstruction,
    modelTier: def?.modelTier,
    temperature: def?.temperature,
    maxOutputTokens: def?.maxOutputTokens,
  };
  const geminiRequest = {
    prompt: promptText,
    schema: schema as z.ZodTypeAny,
    systemInstruction: def?.systemInstruction,
    model: resolveGeminiModel(def?.modelTier),
    temperature: def?.temperature,
    maxOutputTokens: def?.maxOutputTokens,
  };

  if (provider === "openai") {
    const oaiResult = await generateOpenAIStructured(oaiRequest);
    if (oaiResult.ok) {
      console.log(`[AI] ${taskName} -> openai (${oaiResult.model})`);
      return oaiResult.value as T;
    }
    console.warn(`[AI] ${taskName} -> openai failed (${oaiResult.reason}), trying gemini fallback`);

    if (hasGeminiApiKey) {
      const geminiResult = await generateGeminiStructured(geminiRequest);
      if (geminiResult.ok) {
        console.log(`[AI] ${taskName} -> gemini fallback (${geminiResult.model})`);
        return geminiResult.value as T;
      }
      if (!allowStaticFallback) {
        throw new UpstreamError(`AI generation failed for ${taskName}.`, {
          provider: "gemini",
          reason: geminiResult.reason,
        });
      }
      console.warn(`[AI] ${taskName} -> gemini fallback also failed (${geminiResult.reason}), using static fallback`);
    } else if (!allowStaticFallback) {
      throw new UpstreamError(`AI generation failed for ${taskName}.`, {
        provider: "gemini",
        reason: "missing_api_key",
      });
    }
    return fallback();
  }

  const result = await generateGeminiStructured(geminiRequest);
  if (result.ok) {
    console.log(`[AI] ${taskName} -> gemini (${result.model})`);
    return result.value as T;
  }
  console.warn(`[AI] ${taskName} -> gemini failed (${result.reason}), trying openai fallback`);

  if (hasOpenAIApiKey) {
    const oaiResult = await generateOpenAIStructured(oaiRequest);
    if (oaiResult.ok) {
      console.log(`[AI] ${taskName} -> openai fallback (${oaiResult.model})`);
      return oaiResult.value as T;
    }
    if (!allowStaticFallback) {
      throw new UpstreamError(`AI generation failed for ${taskName}.`, {
        provider: "openai",
        reason: oaiResult.reason,
      });
    }
    console.warn(`[AI] ${taskName} -> openai fallback also failed (${oaiResult.reason}), using static fallback`);
  } else if (!allowStaticFallback) {
    throw new UpstreamError(`AI generation failed for ${taskName}.`, {
      provider: "openai",
      reason: "missing_api_key",
    });
  }
  return fallback();
}
