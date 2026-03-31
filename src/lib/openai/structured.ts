import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { requireOpenAIClient, OpenAIUnavailableError } from "@/lib/openai/client";
import { env } from "@/lib/env";
import type { ModelTier } from "@/lib/prompts/shared";

export interface OpenAIStructuredRequest<TSchema extends z.ZodTypeAny> {
  prompt: string;
  schema: TSchema;
  schemaName: string;
  systemInstruction?: string;
  modelTier?: ModelTier;
  temperature?: number;
  maxOutputTokens?: number;
}

export type OpenAIStructuredSuccess<TValue> = {
  ok: true;
  value: TValue;
  rawText: string;
  model: string;
  attempts: 1 | 2;
};

export type OpenAIStructuredFailure = {
  ok: false;
  reason: "missing_api_key" | "sdk_error" | "invalid_json" | "schema_validation_failed" | "refusal";
  message: string;
  rawText?: string;
  issues?: string[];
  error?: unknown;
  attempts: 1 | 2;
};

export type OpenAIStructuredResult<TValue> =
  | OpenAIStructuredSuccess<TValue>
  | OpenAIStructuredFailure;

function resolveOpenAIModel(tier?: ModelTier): string {
  if (tier === "lite") return env.OPENAI_MODEL;
  return env.OPENAI_SMART_MODEL;
}

function isArraySchema(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodArray) return true;
  if ("innerType" in schema && typeof (schema as { innerType: () => z.ZodTypeAny }).innerType === "function") {
    return isArraySchema((schema as { innerType: () => z.ZodTypeAny }).innerType());
  }
  if ("_def" in schema) {
    const def = (schema as { _def: { type?: string; typeName?: string } })._def;
    if (def.typeName === "ZodArray" || def.type === "array") return true;
  }
  return false;
}

function wrapArraySchema(schema: z.ZodTypeAny): z.ZodObject<{ items: z.ZodTypeAny }> {
  return z.object({ items: schema });
}

function normalizeForOpenAIStrict(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional) {
    return normalizeForOpenAIStrict(schema.unwrap() as z.ZodTypeAny).nullable();
  }

  if (schema instanceof z.ZodNullable) {
    return normalizeForOpenAIStrict(schema.unwrap() as z.ZodTypeAny).nullable();
  }

  if (schema instanceof z.ZodDefault) {
    return normalizeForOpenAIStrict(schema.removeDefault() as z.ZodTypeAny).default(
      (schema.def as { defaultValue: unknown }).defaultValue,
    );
  }

  if (schema instanceof z.ZodObject) {
    const normalizedShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, value] of Object.entries(schema.shape)) {
      normalizedShape[key] = normalizeForOpenAIStrict(value as z.ZodTypeAny);
    }
    return z.object(normalizedShape);
  }

  if (schema instanceof z.ZodArray) {
    let normalizedArray = z.array(normalizeForOpenAIStrict(schema.element as z.ZodTypeAny));

    const checks = (schema.def as { checks?: Array<{ _zod?: { def?: { check?: string; minimum?: number; maximum?: number; value?: number } } }> }).checks ?? [];
    for (const check of checks) {
      const def = check._zod?.def;
      if (!def) continue;
      if (def.check === "min_length" && typeof def.minimum === "number") {
        normalizedArray = normalizedArray.min(def.minimum);
      } else if (def.check === "max_length" && typeof def.maximum === "number") {
        normalizedArray = normalizedArray.max(def.maximum);
      } else if (def.check === "length_equals" && typeof def.value === "number") {
        normalizedArray = normalizedArray.length(def.value);
      }
    }

    return normalizedArray;
  }

  if (schema instanceof z.ZodPipe) {
    const pipeDef = schema.def as unknown as { in: z.ZodTypeAny; out: z.ZodTypeAny };
    return pipeDef.in.pipe(normalizeForOpenAIStrict(pipeDef.out));
  }

  return schema;
}

export async function generateOpenAIStructured<TSchema extends z.ZodTypeAny>(
  request: OpenAIStructuredRequest<TSchema>,
): Promise<OpenAIStructuredResult<z.infer<TSchema>>> {
  const model = resolveOpenAIModel(request.modelTier);
  const maxAttempts = 2;

  const strictSchema = normalizeForOpenAIStrict(request.schema);
  const needsArrayWrap = isArraySchema(strictSchema);
  const effectiveSchema = needsArrayWrap ? wrapArraySchema(strictSchema) : strictSchema;
  const effectivePrompt = needsArrayWrap
    ? `${request.prompt}\n\nIMPORTANT: Return your array inside a JSON object with key "items". Example: { "items": [...] }`
    : request.prompt;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = requireOpenAIClient();

      const systemContent = attempt === 1
        ? request.systemInstruction ?? "You are a helpful assistant. Return valid JSON only."
        : [
            request.systemInstruction ?? "You are a helpful assistant.",
            "Your previous answer was invalid or mismatched the schema.",
            "Return valid JSON only. No markdown fences, explanations, or commentary.",
          ].filter(Boolean).join("\n\n");

      const completion = await client.chat.completions.parse({
        model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: effectivePrompt },
        ],
        response_format: zodResponseFormat(effectiveSchema as z.ZodTypeAny, request.schemaName),
        temperature: request.temperature ?? undefined,
        max_tokens: request.maxOutputTokens ?? undefined,
      });

      const choice = completion.choices[0];

      if (choice?.message.refusal) {
        console.error("[OpenAI structured] Model refused:", choice.message.refusal);
        return {
          ok: false,
          reason: "refusal",
          message: choice.message.refusal,
          attempts: attempt as 1 | 2,
        };
      }

      const parsed = choice?.message.parsed;
      if (parsed != null) {
        const unwrapped = needsArrayWrap ? (parsed as { items: unknown }).items : parsed;
        const rawText = choice.message.content ?? JSON.stringify(parsed);
        console.log(`[OpenAI structured] ${request.schemaName} via ${model} (attempt ${attempt})`);
        return {
          ok: true,
          value: unwrapped as z.infer<TSchema>,
          rawText,
          model,
          attempts: attempt as 1 | 2,
        };
      }

      const rawText = choice?.message.content ?? "";
      if (rawText) {
        try {
          const rawParsed = JSON.parse(rawText);
          const toParse = needsArrayWrap ? rawParsed?.items ?? rawParsed : rawParsed;
          const zodResult = request.schema.safeParse(toParse);
          if (zodResult.success) {
            return {
              ok: true,
              value: zodResult.data,
              rawText,
              model,
              attempts: attempt as 1 | 2,
            };
          }
          console.error("[OpenAI structured] Zod validation failed:", zodResult.error.issues.map((i) => i.message));
        } catch {
          console.error("[OpenAI structured] JSON parse failed on raw text");
        }

        if (attempt < maxAttempts) continue;

        return {
          ok: false,
          reason: "schema_validation_failed",
          message: "OpenAI returned JSON that did not match the schema.",
          rawText,
          attempts: attempt as 1 | 2,
        };
      }

      console.error("[OpenAI structured] Empty response");
      if (attempt < maxAttempts) continue;

      return {
        ok: false,
        reason: "sdk_error",
        message: "OpenAI returned an empty response.",
        attempts: attempt as 1 | 2,
      };
    } catch (error) {
      if (error instanceof OpenAIUnavailableError) {
        return {
          ok: false,
          reason: "missing_api_key",
          message: error.message,
          error,
          attempts: attempt as 1 | 2,
        };
      }

      const message = error instanceof Error ? error.message : "OpenAI request failed.";
      console.error("[OpenAI structured] SDK error:", message);

      if (attempt < maxAttempts) continue;

      return {
        ok: false,
        reason: "sdk_error",
        message,
        error,
        attempts: attempt as 1 | 2,
      };
    }
  }

  return {
    ok: false,
    reason: "sdk_error",
    message: "OpenAI structured generation failed after all attempts.",
    attempts: 2,
  };
}
