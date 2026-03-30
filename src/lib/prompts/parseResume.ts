import { resumeProfileSchema, type ResumeProfile } from "@/lib/types/domain";

import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

export interface ParseResumePromptInput {
  resumeText: string;
  sourceFilename?: string;
}

export function buildParseResumePrompt(
  input: ParseResumePromptInput | string,
): PromptDefinition<typeof resumeProfileSchema> {
  const normalizedInput =
    typeof input === "string" ? { resumeText: input } : input;

  const systemInstruction = jsonOnlyInstruction(
    "You are a resume extraction engine. Normalize a candidate's resume into a structured profile with no invented details.",
  );

  const userPrompt = joinPromptSections(
    normalizedInput.sourceFilename
      ? `Source filename: ${normalizedInput.sourceFilename}`
      : null,
    "Extract the resume into this JSON shape:",
    `ResumeProfile schema: ${JSON.stringify({} as ResumeProfile)}`,
    "Rules:",
    "- Use uncertainFields for ambiguous or partially missing items.",
    "- Preserve concrete metrics, skills, achievements, and leadership signals.",
    "- Do not invent employers, titles, dates, or metrics.",
    "Resume text:",
    normalizedInput.resumeText,
  );

  return {
    name: "parseResume",
    systemInstruction,
    userPrompt,
    responseSchema: resumeProfileSchema,
    temperature: 0.1,
    maxOutputTokens: 8192,
  };
}
