import {
  coachingSchema,
  type JobAnalysis,
  type ResumeProfile,
  type EvaluationPayload,
} from "@/lib/types/domain";

import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

export interface CoachSessionPromptInput {
  evaluation: EvaluationPayload;
  resumeProfile: ResumeProfile;
  jobAnalysis: JobAnalysis;
  transcript: string;
}

export function buildCoachSessionPrompt(
  input:
    | CoachSessionPromptInput
    | {
        transcript: string;
        evaluation: EvaluationPayload;
      },
): PromptDefinition<typeof coachingSchema> {
  const normalizedInput =
    "resumeProfile" in input
      ? input
      : {
          evaluation: input.evaluation,
          resumeProfile: {
            professionalSummary: "Candidate profile unavailable.",
            roles: [],
            skills: [],
            education: [],
            metrics: [],
            leadershipSignals: [],
            domainKeywords: [],
          } satisfies ResumeProfile,
          jobAnalysis: {
            titleGuess: "Target role unavailable",
            seniority: "unspecified",
            coreCompetencies: [],
            mustHaveSkills: [],
            niceToHaveSkills: [],
            likelyInterviewThemes: [],
            hiddenSignals: [],
            likelyConcerns: [],
          } satisfies JobAnalysis,
          transcript: input.transcript,
        };

  const systemInstruction = jsonOnlyInstruction(
    "You are a coaching engine. Turn the evaluation into concrete practice-ready rewrites, next steps, and drills.",
  );

  const userPrompt = joinPromptSections(
    `Overall score: ${normalizedInput.evaluation.overallScore}`,
    `Evaluation summary: ${normalizedInput.evaluation.summary}`,
    `Resume summary: ${normalizedInput.resumeProfile.professionalSummary}`,
    `Job title guess: ${normalizedInput.jobAnalysis.titleGuess}`,
    "Rules:",
    "- Generate concrete rewritten answers.",
    "- Explain why each rewrite is better.",
    "- Produce practical next-step practice drills.",
    "- Avoid vague encouragement without substance.",
    "Transcript:",
    normalizedInput.transcript,
  );

  return {
    name: "coachSession",
    systemInstruction,
    userPrompt,
    responseSchema: coachingSchema,
    temperature: 0.2,
    maxOutputTokens: 8192,
  };
}
