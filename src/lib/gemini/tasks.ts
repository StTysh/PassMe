import { buildAnalyzeJobPrompt } from "@/lib/prompts/analyzeJob";
import { buildInterviewPlanPrompt } from "@/lib/prompts/buildPlan";
import { buildCoachSessionPrompt } from "@/lib/prompts/coachSession";
import { buildEvaluateSessionPrompt } from "@/lib/prompts/evaluateSession";
import { buildLiveInterviewerPrompt } from "@/lib/prompts/liveInterviewer";
import { buildParseResumePrompt } from "@/lib/prompts/parseResume";
import { generateStructured } from "@/lib/gemini/structured";
import { createId } from "@/lib/ids";
import type {
  CoachingPayload,
  EvaluationPayload,
  InterviewPlan,
  JobAnalysis,
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

  buildPlan(input: {
    interviewType: "recruiter_screen" | "hiring_manager" | "behavioral" | "technical_general" | "system_design_light";
    difficulty: "easy" | "realistic" | "hard";
    interestLevel: "low" | "medium" | "high";
    durationMinutes: number;
    persona: PersonaDefinition;
    resume: ResumeProfile;
    job: JobAnalysis;
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
    persona: PersonaDefinition;
    sessionObjective: string;
    interviewType: "recruiter_screen" | "hiring_manager" | "behavioral" | "technical_general" | "system_design_light";
    difficulty: "easy" | "realistic" | "hard";
    interestLevel: "low" | "medium" | "high";
    recentTranscript: Array<{ speaker: string; text: string }>;
    contextSnippets: string[];
    remainingQuestions: number;
    followUpBudget: number;
  }) {
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
        questionCategory: needsEvidence ? "evidence" : "tradeoffs",
        shouldEnd: input.remainingQuestions <= 0,
      };
    };

    const structured = await generateStructured({
      prompt: buildLiveInterviewerPrompt({
        persona: input.persona,
        interviewType: input.interviewType,
        difficulty: input.difficulty,
        interestLevel: input.interestLevel,
        sessionObjective: input.sessionObjective,
        currentQuestionCount: input.recentTranscript.filter((turn) => turn.speaker === "agent").length,
        followUpCount: input.recentTranscript.filter((turn) => turn.speaker === "agent").length,
        timeRemainingMinutes: 0,
        remainingMainQuestionBudget: input.remainingQuestions,
        remainingFollowUpBudget: input.followUpBudget,
        recentTranscript: input.recentTranscript.map((turn) => `${turn.speaker}: ${turn.text}`).join("\n"),
        retrievedContextSnippets: input.contextSnippets,
      } as never),
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
