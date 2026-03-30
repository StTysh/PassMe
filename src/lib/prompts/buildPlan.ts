import {
  type Difficulty,
  difficultySchema,
  interviewPlanSchema,
  interviewTypeSchema,
  type InterviewType,
  type InterestLevel,
  interestLevelSchema,
  type JobAnalysis,
  type PersonaConfig,
  personaConfigSchema,
  type ResumeProfile,
} from "@/lib/types/domain";

import {
  joinPromptSections,
  jsonOnlyInstruction,
  numberedList,
  type PromptDefinition,
} from "@/lib/prompts/shared";

const INTERVIEW_TYPE_HEURISTICS: Record<InterviewType, string[]> = {
  recruiter_screen: [
    "motivation",
    "concise background summary",
    "fit",
    "logistics and interest",
    "red flags",
  ],
  hiring_manager: [
    "ownership",
    "outcomes",
    "tradeoffs",
    "prioritization",
    "collaboration",
    "strategy and decision-making",
  ],
  behavioral: ["STAR-oriented answers", "conflict", "failure", "influence", "ambiguity", "leadership"],
  technical_general: [
    "problem-solving",
    "implementation detail",
    "architecture basics",
    "debugging and tradeoffs",
  ],
  system_design_light: [
    "requirements",
    "approach",
    "tradeoffs",
    "bottlenecks",
    "reliability and observability",
  ],
};

export interface BuildPlanPromptInput {
  resumeProfile: ResumeProfile;
  jobAnalysis: JobAnalysis;
  persona: PersonaConfig;
  interviewType: InterviewType;
  difficulty: Difficulty;
  interestLevel: InterestLevel;
  durationMinutes: number;
}

export function buildInterviewPlanPrompt(
  input:
    | BuildPlanPromptInput
    | {
        resume: ResumeProfile;
        job: JobAnalysis;
        persona: PersonaConfig;
        interviewType: InterviewType;
        difficulty: Difficulty;
        interestLevel: InterestLevel;
        durationMinutes: number;
      },
): PromptDefinition<typeof interviewPlanSchema> {
  const normalizedInput =
    "resumeProfile" in input
      ? input
      : {
          resumeProfile: input.resume,
          jobAnalysis: input.job,
          persona: input.persona,
          interviewType: input.interviewType,
          difficulty: input.difficulty,
          interestLevel: input.interestLevel,
          durationMinutes: input.durationMinutes,
        };

  const systemInstruction = jsonOnlyInstruction(
    "You are an interview planning engine. Build a realistic, concise interview plan aligned to the candidate, role, persona, difficulty, and session duration.",
  );

  const userPrompt = joinPromptSections(
    numberedList(
      "Hardcoded focus areas by interview type:",
      INTERVIEW_TYPE_HEURISTICS[normalizedInput.interviewType],
    ),
    `Interview type: ${normalizedInput.interviewType}`,
    `Difficulty: ${normalizedInput.difficulty}`,
    `Interest level: ${normalizedInput.interestLevel}`,
    `Duration minutes: ${normalizedInput.durationMinutes}`,
    `Persona: ${normalizedInput.persona.name} (${normalizedInput.persona.key})`,
    `Resume profile summary: ${normalizedInput.resumeProfile.professionalSummary}`,
    `Job title guess: ${normalizedInput.jobAnalysis.titleGuess}`,
    "Plan requirements:",
    "- Keep the session realistic and within the duration.",
    "- Target candidate strengths and likely gaps.",
    "- Provide starter questions that fit the persona and interview type.",
    "- Keep follow-up rules practical and specific.",
    "- Do not over-generalize beyond the target role.",
    "Return JSON matching the InterviewPlan schema exactly.",
  );

  return {
    name: "buildInterviewPlan",
    systemInstruction,
    userPrompt,
    responseSchema: interviewPlanSchema,
    temperature: 0.2,
    maxOutputTokens: 1400,
  };
}

export const interviewTypeHeuristicsSchema = interviewTypeSchema;
export const difficultyHeuristicsSchema = difficultySchema;
export const interestLevelHeuristicsSchema = interestLevelSchema;
export const personaPlanSchema = personaConfigSchema;
