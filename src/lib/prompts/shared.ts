import type { ZodTypeAny } from "zod";

export type ModelTier = "default" | "lite";

export interface PromptDefinition<TSchema extends ZodTypeAny = ZodTypeAny> {
  name: string;
  systemInstruction: string;
  userPrompt: string;
  responseSchema: TSchema;
  temperature: number;
  maxOutputTokens: number;
  modelTier?: ModelTier;
}

export function joinPromptSections(...sections: Array<string | null | undefined>) {
  return sections
    .map((section) => section?.trim())
    .filter((section): section is string => Boolean(section))
    .join("\n\n");
}

export function bulletList(title: string, items: string[]) {
  return joinPromptSections(
    title,
    items.map((item) => `- ${item}`).join("\n"),
  );
}

export function numberedList(title: string, items: string[]) {
  return joinPromptSections(
    title,
    items.map((item, index) => `${index + 1}. ${item}`).join("\n"),
  );
}

export function jsonOnlyInstruction(summary: string) {
  return `${summary}\nReturn valid JSON only. Do not wrap the result in markdown fences.`;
}
