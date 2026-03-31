import { cvValidationResultSchema } from "@/lib/types/domain";
import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";
import type { ResumeProfile } from "@/lib/types/domain";

export function buildValidateResumePrompt(
  resume: ResumeProfile,
): PromptDefinition<typeof cvValidationResultSchema> {
  const systemInstruction = jsonOnlyInstruction(
    "You are a strict CV quality auditor. Analyze a parsed resume and identify real issues that would hurt interview performance. Be specific and actionable.",
  );

  const userPrompt = joinPromptSections(
    "Validate this parsed resume for interview readiness.",
    `Parsed resume:\n${JSON.stringify(resume, null, 2)}`,
    "Check for ALL of the following:",
    "- Missing or vague professional summary",
    "- Roles with no achievements or only responsibilities (no impact)",
    "- Missing dates on roles (start/end)",
    "- Skills listed but never evidenced in any role description",
    "- Inconsistent timeline (overlapping dates, impossible gaps)",
    "- No quantified metrics anywhere (numbers, percentages, revenue, users)",
    "- Missing education if the role likely requires it",
    "- Very short resume with minimal content",
    "- Roles with generic descriptions that lack specificity",
    "Severity guide:",
    "- error: will seriously hurt interview performance (e.g., no achievements anywhere, completely missing summary)",
    "- warning: noticeable gap that should be fixed (e.g., some roles lack metrics, missing dates)",
    "- info: minor improvement opportunity (e.g., could add more skills detail)",
    "Set isValid to true only if there are no error-severity issues.",
    "Provide 1-3 practical suggestions for improving the resume.",
    "Return JSON matching the CVValidationResult schema.",
  );

  return {
    name: "validateResume",
    systemInstruction,
    userPrompt,
    responseSchema: cvValidationResultSchema,
    temperature: 0.15,
    maxOutputTokens: 4096,
    modelTier: "lite" as const,
  };
}
