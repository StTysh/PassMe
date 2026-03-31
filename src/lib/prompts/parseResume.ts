import { resumeProfileSchema } from "@/lib/types/domain";

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
    "Extract the resume into this JSON shape. Every field must be present in the JSON output. Use null for any missing optional value instead of omitting the field.",
    "ResumeProfile fields: candidateName, candidateEmail, candidateHeadline, totalYearsExperience, primaryDomain, professionalSummary, roles, skills, education, metrics, leadershipSignals, domainKeywords, uncertainFields.",
    "For each role, include company, title, startDate, endDate, achievements, responsibilities, and skillsUsed.",
    "Rules:",
    "- Extract candidateName (full name), candidateEmail, and candidateHeadline (current title or professional headline) when available; otherwise use null.",
    "- Estimate totalYearsExperience from work history date ranges. Set primaryDomain to the candidate's main field (e.g., 'Frontend', 'Backend', 'Product', 'Data Science'). Use null if you cannot infer it.",
    "- Use uncertainFields for ambiguous or partially missing items. Use null when there are no uncertain fields to report.",
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
    modelTier: "lite" as const,
  };
}
