import {
  interviewerResponseSchema,
  type Difficulty,
  type InterviewType,
  type InterestLevel,
  type PersonaConfig,
} from "@/lib/types/domain";

import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

export interface LiveInterviewerPromptInput {
  persona: PersonaConfig;
  interviewType: InterviewType;
  difficulty: Difficulty;
  interestLevel: InterestLevel;
  sessionObjective: string;
  currentQuestionCount: number;
  followUpCount: number;
  timeRemainingMinutes: number;
  remainingMainQuestionBudget: number;
  remainingFollowUpBudget: number;
  recentTranscript: string;
  retrievedContextSnippets: string[];
}

export function buildLiveInterviewerPrompt(
  input:
    | LiveInterviewerPromptInput
    | {
        personaDescription: string;
        sessionObjective: string;
        interviewType: string;
        difficulty: string;
        recentTranscript: Array<{ speaker: string; text: string }>;
        contextSnippets: string[];
        remainingQuestions: number;
        followUpBudget: number;
        interestLevel?: InterestLevel;
      },
): PromptDefinition<typeof interviewerResponseSchema> {
  const normalizedInput =
    "persona" in input
      ? input
      : {
          persona: {
            key: "neutral_manager" as const,
            name: "Live Interviewer",
            description: input.personaDescription,
            tone: input.personaDescription,
            warmth: 50,
            skepticism: 50,
            interruptionFrequency: 20,
            followUpIntensity: 60,
            challengeStyle: "balanced" as const,
            focusAreas: ["ownership", "clarity"],
            openingStyle: "focused",
            closingStyle: "concise",
          },
          interviewType: input.interviewType,
          difficulty: input.difficulty,
          interestLevel: input.interestLevel ?? "medium",
          sessionObjective: input.sessionObjective,
          currentQuestionCount: 0,
          followUpCount: 0,
          timeRemainingMinutes: 0,
          remainingMainQuestionBudget: input.remainingQuestions,
          remainingFollowUpBudget: input.followUpBudget,
          recentTranscript: input.recentTranscript
            .map((turn) => `${turn.speaker}: ${turn.text}`)
            .join("\n"),
          retrievedContextSnippets: input.contextSnippets,
        };

  const systemInstruction = jsonOnlyInstruction(
    "You are the live interview question generator. Stay in persona, ask one question at a time, and never coach the candidate during the interview.",
  );

  const userPrompt = joinPromptSections(
    `Persona: ${normalizedInput.persona.name}`,
    `Tone: ${normalizedInput.persona.tone}`,
    `Interview type: ${normalizedInput.interviewType}`,
    `Difficulty: ${normalizedInput.difficulty}`,
    `Interest level: ${normalizedInput.interestLevel}`,
    `Session objective: ${normalizedInput.sessionObjective}`,
    `Current main question count: ${normalizedInput.currentQuestionCount}`,
    `Current follow-up count: ${normalizedInput.followUpCount}`,
    `Remaining main question budget: ${normalizedInput.remainingMainQuestionBudget}`,
    `Remaining follow-up budget: ${normalizedInput.remainingFollowUpBudget}`,
    `Time remaining minutes: ${normalizedInput.timeRemainingMinutes}`,
    "Rules:",
    "- Stay in persona.",
    "- Ask one question at a time.",
    "- Do not leak the scoring rubric.",
    "- Keep responses concise.",
    "- Probe weak answers, then move on when sufficient.",
    "- Do not output markdown bullet lists.",
    "- Do not output JSON to the candidate, even though the app validates this internal response.",
    normalizedInput.recentTranscript
      ? `Recent transcript:\n${normalizedInput.recentTranscript}`
      : null,
    normalizedInput.retrievedContextSnippets.length
      ? joinPromptSections(
          "Retrieved context snippets:",
          normalizedInput.retrievedContextSnippets
            .map((snippet) => `- ${snippet}`)
            .join("\n"),
        )
      : null,
    "Return JSON matching the internal interviewer response schema exactly.",
  );

  return {
    name: "liveInterviewer",
    systemInstruction,
    userPrompt,
    responseSchema: interviewerResponseSchema,
    temperature: 0.5,
    maxOutputTokens: 4096,
  };
}
