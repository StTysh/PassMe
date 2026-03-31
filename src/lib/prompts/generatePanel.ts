import { panelCoreSchema } from "@/lib/types/domain";
import type { CompanyResearch, JobAnalysis, ResumeProfile } from "@/lib/types/domain";
import { z } from "zod";
import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

const panelCoreArraySchema = z.array(panelCoreSchema);

export function buildGeneratePanelPrompt(input: {
  companyResearch: CompanyResearch;
  jobAnalysis: JobAnalysis;
  resumeProfile: ResumeProfile;
  interviewType: string;
  panelSize: number;
}): PromptDefinition<typeof panelCoreArraySchema> {
  const systemInstruction = jsonOnlyInstruction(
    "You are a world-class interview simulation designer. Create interviewer personas that feel like real professionals - each with a coherent identity, professional background, and distinct communication style grounded in the target company and role.",
  );

  const panelRules =
    input.panelSize === 1
      ? joinPromptSections(
          "SINGLE INTERVIEWER MODE:",
          "Create one fully realized interviewer with a complete professional identity and distinctive style.",
        )
      : input.panelSize === 2
        ? joinPromptSections(
            "TWO INTERVIEWER MODE:",
            "Create two interviewers who complement each other - different evaluation styles, different communication styles, plausible working relationship.",
            "Vary genders. They should NOT ask the same style of questions.",
          )
        : joinPromptSections(
            "THREE INTERVIEWER MODE:",
            "Create three interviewers forming a believable panel - e.g., hiring manager, technical lead, culture representative.",
            "Vary genders. Distribute focus areas to cover the role holistically.",
            "One should naturally lead opening and closing.",
          );

  const userPrompt = joinPromptSections(
    `Generate ${input.panelSize} interviewer persona(s) for a ${input.interviewType.replace(/_/g, " ")} interview.`,

    joinPromptSections(
      "COMPANY CONTEXT:",
      `Company: ${input.companyResearch.confirmedName ?? "Unknown"} (${input.companyResearch.industry ?? "Unknown"})`,
      input.companyResearch.summary,
      input.companyResearch.missionAndValues?.length
        ? `Values: ${input.companyResearch.missionAndValues.join(", ")}`
        : `Values: ${input.companyResearch.values.join(", ")}`,
      `Culture: ${input.companyResearch.culture}`,
      `Interview style: ${input.companyResearch.interviewStyle}`,
      input.companyResearch.roleContribution ? `Role contribution: ${input.companyResearch.roleContribution}` : null,
    ),

    joinPromptSections(
      "ROLE:",
      `${input.jobAnalysis.titleGuess} (${input.jobAnalysis.seniority})`,
      `Core competencies: ${input.jobAnalysis.coreCompetencies.join(", ")}`,
      `Must-have skills: ${input.jobAnalysis.mustHaveSkills.join(", ")}`,
    ),

    `CANDIDATE: ${input.resumeProfile.professionalSummary}`,
    panelRules,

    joinPromptSections(
      "For EACH interviewer, provide ALL of these fields:",
      "- key: 'interviewer_1', 'interviewer_2', etc.",
      "- name: realistic full name",
      "- ageRange: e.g. '38-42'",
      "- role: actual job title at this company",
      "- department: team or function",
      "- seniorityLevel: e.g. 'Senior Director', 'Staff Engineer'",
      "- yearsExperience: total years (number)",
      "- educationBackground: specific (e.g., 'CS at UC Berkeley')",
      "- careerPath: 2-3 sentence narrative",
      "- companyTenure: time at company",
      "- gender: 'male' or 'female'",
      "- hiringPriorities: 3-5 specific things they look for (array)",
      "- interviewPhilosophy: 2-3 sentences on their interview approach",
      "- biggestConcerns: red flags they watch for (array)",
      "- whatTheyValueMost: one sentence about what earns their respect",
      "- whatFrustratesThem: specific interview behaviors that annoy them",
      "- domainExpertise: 2-4 areas of deep knowledge (array)",
      "- warmth: 0-100 (number)",
      "- skepticism: 0-100 (number)",
      "- challengeStyle: 'soft', 'balanced', or 'sharp'",
      "- focusAreas: 3-5 areas they will explore (array)",
      "- tone: short descriptor (e.g., 'warm but probing')",
      "- personality: 3-4 sentence paragraph capturing their essence",
      "- voicePreference: 'female-1', 'female-2', 'male-1', or 'male-2' (match gender)",
      "- avatarColor: pick from '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'",
      "- openingMessage: Their actual first-person opening for this interview (3-6 sentences: greeting, intro, role, framing, transition, first question). Must sound like a real human. If you cannot write a natural opening, return null rather than omitting the field.",
    ),

    "CRITICAL: Every field must be specific and original. Include every field in the JSON output. Use null instead of omitting any field that cannot be grounded confidently. The openingMessage must sound natural, not templated. Different interviewers must sound genuinely different.",
    "Return a JSON array.",
  );

  return {
    name: "generatePanel",
    systemInstruction,
    userPrompt,
    responseSchema: panelCoreArraySchema,
    temperature: 0.6,
    maxOutputTokens: 8192,
  };
}
