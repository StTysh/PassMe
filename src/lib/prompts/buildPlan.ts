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
  type CompanyResearch,
  type PanelInterviewer,
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
  companyResearch?: CompanyResearch | null;
  panel?: PanelInterviewer[] | null;
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
        companyResearch?: CompanyResearch | null;
        panel?: PanelInterviewer[] | null;
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
          companyResearch: input.companyResearch,
          panel: input.panel,
        };

  const systemInstruction = jsonOnlyInstruction(
    "You are an interview planning engine. Build a realistic, concise interview plan aligned to the candidate, role, company culture, persona, difficulty, and session duration. Questions should feel like they come from real interviewers at this specific company.",
  );

  const cr = normalizedInput.companyResearch;
  const companySection = cr
    ? joinPromptSections(
        `Company: ${cr.confirmedName ?? "Unknown"} (${cr.industry ?? "Unknown"})`,
        cr.summary,
        cr.coreBusinessModel ? `Business model: ${cr.coreBusinessModel}` : null,
        cr.missionAndValues?.length ? `Mission & values: ${cr.missionAndValues.join(", ")}` : `Values: ${cr.values.join(", ")}`,
        `Culture: ${cr.culture}`,
        cr.strategicPriorities?.length ? `Strategic priorities: ${cr.strategicPriorities.join(", ")}` : `Goals: ${cr.goals.join(", ")}`,
        `Interview style: ${cr.interviewStyle}`,
        cr.roleContribution ? `Role contribution: ${cr.roleContribution}` : `Role context: ${cr.roleContext}`,
        cr.likelyCompetencyAreas?.length ? `Likely competency areas: ${cr.likelyCompetencyAreas.join(", ")}` : null,
        cr.likelyConcernsAboutCandidates?.length ? `Interviewer concerns: ${cr.likelyConcernsAboutCandidates.join(", ")}` : null,
        cr.hiringCultureSignals?.length ? `Hiring signals: ${cr.hiringCultureSignals.join("; ")}` : null,
        cr.teamExpectations ? `Team expectations: ${cr.teamExpectations}` : null,
      )
    : null;

  const panelSection = normalizedInput.panel?.length
    ? joinPromptSections(
        "Interview panel (questions should align with each interviewer's focus and style):",
        ...normalizedInput.panel.map(
          (p) =>
            `- ${p.name} (${p.role}, ${p.department}): ${p.personality} Focus: ${p.focusAreas.join(", ")}. Interview philosophy: ${p.interviewPhilosophy}. Hiring priorities: ${p.hiringPriorities.join(", ")}. Starts ${p.startBroadOrSpecific}. Question preference: ${p.questionPreference}.`,
        ),
      )
    : null;

  const resumeSection = joinPromptSections(
    `Resume summary: ${normalizedInput.resumeProfile.professionalSummary}`,
    normalizedInput.resumeProfile.roles.length > 0
      ? `Key roles: ${normalizedInput.resumeProfile.roles.map((r) => `${r.title} at ${r.company}`).join(", ")}`
      : null,
    normalizedInput.resumeProfile.skills.length > 0
      ? `Skills: ${normalizedInput.resumeProfile.skills.join(", ")}`
      : null,
    normalizedInput.resumeProfile.metrics.length > 0
      ? `Metrics: ${normalizedInput.resumeProfile.metrics.join("; ")}`
      : null,
  );

  const userPrompt = joinPromptSections(
    numberedList(
      "Focus areas by interview type:",
      INTERVIEW_TYPE_HEURISTICS[normalizedInput.interviewType],
    ),
    `Interview type: ${normalizedInput.interviewType}`,
    `Difficulty: ${normalizedInput.difficulty}`,
    `Interest level: ${normalizedInput.interestLevel}`,
    `Duration minutes: ${normalizedInput.durationMinutes}`,
    `Persona: ${normalizedInput.persona.name} (${normalizedInput.persona.key})`,
    companySection,
    panelSection,
    resumeSection,
    `Job title: ${normalizedInput.jobAnalysis.titleGuess} (${normalizedInput.jobAnalysis.seniority})`,
    `Core competencies: ${normalizedInput.jobAnalysis.coreCompetencies.join(", ")}`,
    `Must-have skills: ${normalizedInput.jobAnalysis.mustHaveSkills.join(", ")}`,
    `Likely concerns: ${normalizedInput.jobAnalysis.likelyConcerns.join(", ")}`,
    "Plan requirements:",
    "- Keep the session realistic and within the duration.",
    "- Questions should reference the candidate's actual background and the company's priorities.",
    "- Target candidate strengths and likely gaps based on the resume vs job requirements.",
    "- Provide starter questions that feel natural for these specific interviewers at this company.",
    "- Include questions that probe for company-specific fit and values alignment.",
    "- Keep follow-up rules practical and specific.",
    "Return JSON matching the InterviewPlan schema exactly.",
  );

  return {
    name: "buildInterviewPlan",
    systemInstruction,
    userPrompt,
    responseSchema: interviewPlanSchema,
    temperature: 0.2,
    maxOutputTokens: 4096,
    modelTier: "lite" as const,
  };
}

export const interviewTypeHeuristicsSchema = interviewTypeSchema;
export const difficultyHeuristicsSchema = difficultySchema;
export const interestLevelHeuristicsSchema = interestLevelSchema;
export const personaPlanSchema = personaConfigSchema;
