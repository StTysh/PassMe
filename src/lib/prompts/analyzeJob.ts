import { jobAnalysisSchema } from "@/lib/types/domain";

import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

export interface AnalyzeJobPromptInput {
  jobDescriptionText: string;
  titleHint?: string;
}

export function buildAnalyzeJobPrompt(
  input: AnalyzeJobPromptInput | string,
): PromptDefinition<typeof jobAnalysisSchema> {
  const normalizedInput =
    typeof input === "string" ? { jobDescriptionText: input } : input;

  const systemInstruction = jsonOnlyInstruction(
    "You are a job signal extraction engine. Analyze the target role and extract the actual skills, competencies, expectations, and interview themes.",
  );

  const userPrompt = joinPromptSections(
    normalizedInput.titleHint ? `Title hint: ${normalizedInput.titleHint}` : null,
    "Extract the job description into structured JSON with this shape:",
    "JobAnalysis fields: titleGuess, seniority, coreCompetencies, mustHaveSkills, niceToHaveSkills, likelyInterviewThemes, hiddenSignals, likelyConcerns",
    "Rules:",
    "- Identify likely interviewer concerns and hidden expectations.",
    "- Keep all arrays specific and role-aware.",
    "- Prefer concise noun phrases for lists.",
    "Job description text:",
    normalizedInput.jobDescriptionText,
  );

  return {
    name: "analyzeJob",
    systemInstruction,
    userPrompt,
    responseSchema: jobAnalysisSchema,
    temperature: 0.1,
    maxOutputTokens: 1200,
  };
}
