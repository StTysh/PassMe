import { buildAnalyzeJobPrompt } from "@/lib/prompts/analyzeJob";
import { buildInterviewPlanPrompt } from "@/lib/prompts/buildPlan";
import { buildCoachSessionPrompt } from "@/lib/prompts/coachSession";
import { buildCompanyResearchPrompt } from "@/lib/prompts/companyResearch";
import { buildResolveCompanyPrompt } from "@/lib/prompts/resolveCompany";
import { buildEvaluateSessionPrompt } from "@/lib/prompts/evaluateSession";
import { buildEnrichPanelPrompt } from "@/lib/prompts/enrichPanel";
import { buildGeneratePanelPrompt } from "@/lib/prompts/generatePanel";
import { buildLiveInterviewerPrompt } from "@/lib/prompts/liveInterviewer";
import { buildParseResumePrompt } from "@/lib/prompts/parseResume";
import { buildValidateResumePrompt } from "@/lib/prompts/validateResume";
import { generateStructured } from "@/lib/gemini/structured";
import { createId } from "@/lib/ids";
import type {
  CVValidationResult,
  CompanyResearch,
  CompanyResolutionResult,
  CoachingPayload,
  EvaluationPayload,
  InterviewPlan,
  JobAnalysis,
  PanelInterviewer,
  PersonaDefinition,
  ResumeProfile,
} from "@/lib/types/domain";
import {
  coachingSchema,
  evaluationSchema,
  interviewPlanSchema,
  interviewerResponseSchema,
  jobAnalysisSchema,
  resumeProfileSchema,
} from "@/lib/validation/api";
import {
  companyResearchSchema,
  companyResolutionSchema,
  cvValidationResultSchema,
  panelCoreSchema,
  panelEnrichmentSchema,
} from "@/lib/types/domain";

function sentences(input: string) {
  return input
    .split(/[\n.]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const geminiTasks = {
  parseResume(rawText: string) {
    return generateStructured({
      prompt: buildParseResumePrompt(rawText),
      schema: resumeProfileSchema,
      fallback: () => {
        const lines = sentences(rawText);
        return {
          professionalSummary: lines[0] ?? "Experienced candidate with relevant background.",
          roles: [
            {
              company: "Most Recent Company",
              title: "Most Recent Title",
              achievements: lines.slice(0, 3),
              responsibilities: lines.slice(3, 6),
              skillsUsed: lines
                .flatMap((line) => line.split(/[,/]/))
                .map((item) => item.trim())
                .filter((item) => item.length > 2)
                .slice(0, 8),
            },
          ],
          skills: lines.flatMap((line) => line.split(/[,/]/)).slice(0, 10),
          education: lines.filter((line) => /university|college|bachelor|master/i.test(line)).slice(0, 3),
          metrics: lines.filter((line) => /\d/.test(line)).slice(0, 6),
          leadershipSignals: lines.filter((line) => /lead|managed|owned|launched/i.test(line)).slice(0, 6),
          domainKeywords: lines.flatMap((line) => line.split(/\s+/)).filter((word) => word.length > 4).slice(0, 12),
          uncertainFields: ["heuristic_parse"],
        } satisfies ResumeProfile;
      },
    });
  },

  analyzeJob(rawText: string) {
    return generateStructured({
      prompt: buildAnalyzeJobPrompt(rawText),
      schema: jobAnalysisSchema,
      fallback: () => {
        const lines = sentences(rawText);
        const titleLine = lines.find((line) => /manager|engineer|director|lead|product/i.test(line)) ?? "Target role";
        return {
          titleGuess: titleLine,
          seniority: /senior|lead|principal|staff/i.test(rawText) ? "senior" : "mid",
          coreCompetencies: lines.slice(0, 5),
          mustHaveSkills: lines.filter((line) => /must|required|experience/i.test(line)).slice(0, 6),
          niceToHaveSkills: lines.filter((line) => /nice|bonus|preferred/i.test(line)).slice(0, 4),
          likelyInterviewThemes: ["role fit", "impact", "execution", "stakeholder management"],
          hiddenSignals: ["clarity", "ownership", "metrics"],
          likelyConcerns: lines.filter((line) => /concern|risk|ambigu/i.test(line)).slice(0, 4),
        } satisfies JobAnalysis;
      },
    });
  },

  validateResume(resume: ResumeProfile) {
    return generateStructured({
      prompt: buildValidateResumePrompt(resume),
      schema: cvValidationResultSchema,
      fallback: () => {
        const issues: CVValidationResult["issues"] = [];
        if (!resume.professionalSummary || resume.professionalSummary.length < 20) {
          issues.push({ field: "professionalSummary", severity: "error", message: "Professional summary is missing or too short." });
        }
        if (resume.roles.length === 0) {
          issues.push({ field: "roles", severity: "error", message: "No work experience roles listed." });
        }
        for (const role of resume.roles) {
          if (role.achievements.length === 0) {
            issues.push({ field: `roles.${role.company}`, severity: "warning", message: `Role at ${role.company} has no achievements.` });
          }
        }
        if (resume.metrics.length === 0) {
          issues.push({ field: "metrics", severity: "warning", message: "No quantified metrics found anywhere in the resume." });
        }
        if (resume.skills.length < 3) {
          issues.push({ field: "skills", severity: "info", message: "Very few skills listed. Consider adding more." });
        }
        return {
          isValid: !issues.some((i) => i.severity === "error"),
          issues,
          suggestions: ["Add quantified metrics to each role.", "Include a strong professional summary."],
        } satisfies CVValidationResult;
      },
    });
  },

  resolveCompany(companyName: string, jobTitle: string, jobDescriptionSnippet?: string) {
    return generateStructured({
      prompt: buildResolveCompanyPrompt(companyName, jobTitle, jobDescriptionSnippet),
      schema: companyResolutionSchema,
      fallback: () => ({
        topMatch: {
          name: companyName,
          industry: "Technology",
          description: `${companyName} is a company that the system could not fully resolve. Please verify this is the correct company.`,
          headquarters: "Unknown",
          companySize: "Unknown",
          website: "Unknown",
          confidence: "low" as const,
          disambiguationNote: "Could not confidently identify this company. Manual confirmation recommended.",
        },
        alternatives: [],
        isAmbiguous: true,
        needsConfirmation: true,
      } satisfies CompanyResolutionResult),
    });
  },

  researchCompany(companyName: string, jobTitle: string, jobDescriptionContext?: string) {
    return generateStructured({
      prompt: buildCompanyResearchPrompt(companyName, jobTitle, jobDescriptionContext),
      schema: companyResearchSchema,
      allowStaticFallback: false,
      fallback: () => ({
        confirmedName: companyName,
        industry: "Technology",
        summary: `${companyName} is a company in the technology and business sector.`,
        coreBusinessModel: "Unknown",
        productsAndServices: [],
        targetMarket: "Unknown",
        positioning: "Unknown",
        missionAndValues: ["innovation", "collaboration", "excellence"],
        strategicPriorities: ["Growth and market leadership"],
        currentInitiatives: ["Product development and market expansion"],
        recentDirection: "Unknown",
        hiringCultureSignals: [],
        teamExpectations: "Professional environment focused on results and teamwork.",
        interviewStyle: "Structured interviews with behavioral and technical components.",
        roleContribution: `The ${jobTitle} role supports core business objectives at ${companyName}.`,
        likelyCompetencyAreas: [],
        likelyConcernsAboutCandidates: [],
        confidenceLevel: "low" as const,
        unknowns: ["Most company details could not be verified"],
        values: ["innovation", "collaboration", "excellence"],
        currentProjects: ["Product development and market expansion"],
        goals: ["Growth and market leadership"],
        culture: "Professional environment focused on results and teamwork.",
        roleContext: `The ${jobTitle} role supports core business objectives at ${companyName}.`,
      } satisfies CompanyResearch),
    });
  },

  generateCorePanel(input: {
    companyResearch: CompanyResearch;
    jobAnalysis: JobAnalysis;
    resumeProfile: ResumeProfile;
    interviewType: string;
    panelSize: number;
  }) {
    return generateStructured({
      prompt: buildGeneratePanelPrompt(input),
      schema: panelCoreSchema.array().min(1).max(3) as never,
      fallback: () => {
        const colors = ["#6366f1", "#10b981", "#f59e0b"];
        return [
          { key: "interviewer_1", name: "Sarah Chen", role: "Hiring Manager", gender: "female" as const, personality: "Direct and results-oriented.", tone: "professional, warm but probing", voicePreference: "female-1", avatarColor: colors[0], focusAreas: ["ownership", "impact"], warmth: 60, skepticism: 55, challengeStyle: "balanced" as const, openingMessage: "Hi, I'm Sarah Chen - the hiring manager for this role. Thanks for making time today. Could you walk me through your background and what brought you to this opportunity?" },
          { key: "interviewer_2", name: "James Rivera", role: "Senior Engineer", gender: "male" as const, personality: "Analytical and detail-oriented.", tone: "calm, precise, curious", voicePreference: "male-1", avatarColor: colors[1], focusAreas: ["technical depth", "problem-solving"], warmth: 45, skepticism: 70, challengeStyle: "sharp" as const, openingMessage: "Hey, James here - senior engineer on the team. Looking forward to digging into the technical side today." },
          { key: "interviewer_3", name: "Priya Patel", role: "Team Lead", gender: "female" as const, personality: "Collaborative and people-focused.", tone: "encouraging, conversational", voicePreference: "female-2", avatarColor: colors[2], focusAreas: ["collaboration", "culture fit"], warmth: 75, skepticism: 35, challengeStyle: "soft" as const, openingMessage: "Hi! I'm Priya, I lead one of the engineering teams here. I'll be exploring how you work with others." },
        ].slice(0, input.panelSize);
      },
    });
  },

  enrichPanel(corePanel: Array<{ key: string; name: string; role: string; personality: string; gender: string; warmth: number; challengeStyle: string; focusAreas: string[] }>, companyName: string, jobTitle: string) {
    return generateStructured({
      prompt: buildEnrichPanelPrompt(corePanel, companyName, jobTitle),
      schema: panelEnrichmentSchema.array() as never,
      fallback: () => corePanel.map((c) => ({ key: c.key })),
    });
  },

  buildPlan(input: {
    interviewType: "recruiter_screen" | "hiring_manager" | "behavioral" | "technical_general" | "system_design_light";
    difficulty: "easy" | "realistic" | "hard";
    interestLevel: "low" | "medium" | "high";
    durationMinutes: number;
    persona: PersonaDefinition;
    resume: ResumeProfile;
    job: JobAnalysis;
    companyResearch?: CompanyResearch | null;
    panel?: PanelInterviewer[] | null;
  }) {
    return generateStructured({
      prompt: buildInterviewPlanPrompt({
        interviewType: input.interviewType,
        difficulty: input.difficulty,
        interestLevel: input.interestLevel,
        durationMinutes: input.durationMinutes,
        persona: input.persona,
        resumeProfile: input.resume,
        jobAnalysis: input.job,
        companyResearch: input.companyResearch,
        panel: input.panel,
      } as never),
      schema: interviewPlanSchema,
      fallback: () => {
        const competencies = [...input.job.coreCompetencies, ...input.persona.focusAreas].slice(0, 5);
        return {
          sessionObjective: `Assess fit for ${input.job.titleGuess} with emphasis on ${competencies[0] ?? "impact"}.`,
          competencySequence: competencies,
          starterQuestions: competencies.slice(0, Math.max(3, Math.min(5, input.durationMinutes / 2))).map((item, index) => ({
            id: createId("q"),
            category: item,
            question:
              index === 0
                ? "Give me a quick overview of your background and how it connects to this role."
                : `Tell me about a time you demonstrated ${item} in a meaningful way.`,
            whyItMatters: `This helps validate ${item} for the target role.`,
          })),
          followUpRules: [
            "Probe for metrics when answers are vague.",
            "Ask for ownership details before moving on.",
            "Tighten to tradeoffs near the end of the session.",
          ],
          likelyGapTargets: input.job.likelyConcerns.slice(0, 4),
          likelyStrengthTargets: input.resume.metrics.slice(0, 4),
        } satisfies InterviewPlan;
      },
    });
  },

  async nextTurn(input: {
    sessionObjective: string;
    interviewType: string;
    difficulty: string;
    recentTranscript: Array<{ speaker: string; text: string; interviewerKey?: string | null }>;
    contextSnippets: string[];
    remainingQuestions: number;
    followUpBudget: number;
    panel: PanelInterviewer[];
    companyResearch?: CompanyResearch | null;
  }) {
    const defaultKey = input.panel[0]?.key ?? "interviewer_1";
    const fallback = () => {
      const lastCandidateTurn = [...input.recentTranscript]
        .reverse()
        .find((turn) => turn.speaker === "candidate")?.text;
      const needsEvidence =
        !lastCandidateTurn ||
        lastCandidateTurn.length < 120 ||
        !/\d|percent|metric|revenue|users|launch|impact/i.test(lastCandidateTurn);

      return {
        agentMessage: needsEvidence
          ? "What specific metric improved, and how did you measure it?"
          : input.remainingQuestions <= 1
            ? "Before we wrap, why does this role make sense as your next step?"
            : "Tell me about the tradeoffs you had to make and what you would do differently now.",
        interviewerKey: defaultKey,
        questionCategory: needsEvidence ? "evidence" : "tradeoffs",
        shouldEnd: input.remainingQuestions <= 0,
      };
    };

    const structured = await generateStructured({
      prompt: buildLiveInterviewerPrompt({
        panel: input.panel,
        companyResearch: input.companyResearch,
        interviewType: input.interviewType,
        difficulty: input.difficulty,
        sessionObjective: input.sessionObjective,
        recentTranscript: input.recentTranscript,
        contextSnippets: input.contextSnippets,
        remainingQuestions: input.remainingQuestions,
        followUpBudget: input.followUpBudget,
      }),
      schema: interviewerResponseSchema,
      fallback: fallback as never,
    });

    return structured;
  },

  evaluateSession(input: {
    transcript: string;
    resume: ResumeProfile;
    job: JobAnalysis;
    interviewType: string;
  }) {
    return generateStructured({
      prompt: buildEvaluateSessionPrompt({
        transcript: input.transcript,
        resumeProfile: input.resume,
        jobAnalysis: input.job,
        interviewType: input.interviewType,
        personaName: "Interview Loop",
      } as never),
      schema: evaluationSchema,
      allowStaticFallback: false,
      fallback: () => {
        const transcript = input.transcript;
        const hasMetrics = /\d|percent|metric|revenue|users|growth/i.test(transcript);
        const hasStructure = /first|second|finally|because|result/i.test(transcript);
        const answers = transcript.split("\n").filter((line) => line.startsWith("candidate:"));
        const avgLength =
          answers.reduce((sum, line) => sum + line.length, 0) / Math.max(answers.length, 1);
        const clarity = avgLength > 120 ? 74 : 61;
        const evidence = hasMetrics ? 78 : 58;
        const structure = hasStructure ? 75 : 60;
        const roleFit = input.job.mustHaveSkills.length > 2 ? 73 : 68;
        const relevance = 72;
        const confidence = avgLength > 100 ? 70 : 60;

        return {
          overallScore: 70,
          dimensionScores: {
            clarity,
            relevance,
            evidence,
            structure,
            roleFit,
            confidence,
          },
          summary:
            "The interview showed credible role alignment, with the strongest moments coming from concrete ownership examples and the biggest gaps coming from inconsistent detail depth.",
          strengths: [
            {
              title: "Role alignment came through",
              body: "Your examples generally mapped back to the target role and made the career story feel coherent.",
              sourceTurnIndexes: [],
            },
            {
              title: "Ownership signals were present",
              body: "You described decisions and outcomes in a way that suggested real accountability.",
              sourceTurnIndexes: [],
            },
          ],
          weaknesses: [
            {
              title: "Evidence was uneven",
              body: "Some answers needed harder proof, tighter metrics, or clearer before-and-after framing.",
              severity: "high",
              sourceTurnIndexes: [1, 3],
            },
            {
              title: "Answer structure drifted",
              body: "A few responses wandered before getting to the core point, which reduced impact.",
              severity: "medium",
              sourceTurnIndexes: [2],
            },
          ],
          missedPoints: [
            {
              title: "Job-specific priorities",
              body: "You could have connected your background more directly to the job's must-have skills and likely concerns.",
            },
          ],
          weakAnswerTargets: [
            {
              turnIndex: 1,
              originalAnswerExcerpt: answers[0]?.slice(0, 180) ?? "Candidate answer excerpt",
              whyWeak: "The answer needed sharper metrics and clearer role-specific impact.",
            },
          ],
        } satisfies EvaluationPayload;
      },
    });
  },

  coachSession(input: { transcript: string; evaluation: EvaluationPayload }) {
    return generateStructured({
      prompt: buildCoachSessionPrompt(input),
      schema: coachingSchema,
      allowStaticFallback: false,
      fallback: () => ({
        rewrittenAnswers: input.evaluation.weakAnswerTargets.map((target) => ({
          originalTurnIndex: target.turnIndex,
          title: "Stronger impact answer",
          improvedAnswer:
            "I owned the initiative end to end, aligned the team on the scope, and drove a measurable outcome. Specifically, I clarified the problem, prioritized the highest-leverage work, and tracked results against a clear baseline so we improved the core metric in a way the business could trust.",
          rationale:
            "This version adds ownership, sequence, evidence, and explicit outcome language.",
        })),
        nextSteps: [
          {
            title: "Tighten your evidence",
            body: "Prepare 3 to 5 stories with metrics, decision points, and clear outcomes before the next interview.",
          },
          {
            title: "Lead with the headline",
            body: "Answer with the result first, then explain the challenge, actions, and tradeoffs.",
          },
        ],
        drills: [
          {
            title: "Metrics drill",
            prompt: "Retell a recent project and include the baseline, action, metric change, and business impact in under 90 seconds.",
          },
        ],
      } satisfies CoachingPayload),
    });
  },
};
