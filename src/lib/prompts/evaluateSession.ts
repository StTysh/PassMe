import {
  evaluationSchema,
  type JobAnalysis,
  type ResumeProfile,
} from "@/lib/types/domain";

import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

export interface EvaluateSessionPromptInput {
  resumeProfile: ResumeProfile;
  jobAnalysis: JobAnalysis;
  transcript: string;
  interviewType: string;
  personaName: string;
}

export function buildEvaluateSessionPrompt(
  input:
    | EvaluateSessionPromptInput
    | {
        transcript: string;
        resume: ResumeProfile;
        job: JobAnalysis;
        interviewType: string;
      },
): PromptDefinition<typeof evaluationSchema> {
  const normalizedInput =
    "resumeProfile" in input
      ? input
      : {
          resumeProfile: input.resume,
          jobAnalysis: input.job,
          transcript: input.transcript,
          interviewType: input.interviewType,
          personaName: "Interview persona",
        };

  const systemInstruction = jsonOnlyInstruction(
    "You are an evaluator, not an interviewer. Grade the transcript against the role and candidate materials, tie judgments to evidence, and output valid JSON only.",
  );

  const userPrompt = joinPromptSections(
    `Interview type: ${normalizedInput.interviewType}`,
    `Persona: ${normalizedInput.personaName}`,
    `Resume summary: ${normalizedInput.resumeProfile.professionalSummary}`,
    `Job title guess: ${normalizedInput.jobAnalysis.titleGuess}`,
    "Requirements:",
    "- Score all dimensions from 0 to 100.",
    "- Tie judgments to transcript evidence and turn indexes when possible.",
    "- Avoid empty generic praise.",
    "- Identify strengths, weaknesses, missed points, and weak answer targets.",
    "Transcript:",
    normalizedInput.transcript,
  );

  return {
    name: "evaluateSession",
    systemInstruction,
    userPrompt,
    responseSchema: evaluationSchema,
    temperature: 0.1,
    maxOutputTokens: 1600,
  };
}
