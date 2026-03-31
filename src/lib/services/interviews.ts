import { FOLLOW_UP_CAP, TURN_HISTORY_WINDOW } from "@/lib/constants";
import { getSqliteClient } from "@/db/client";
import { assignVoiceToInterviewer, getElevenLabsApiKey } from "@/lib/elevenlabs/client";
import { geminiTasks } from "@/lib/gemini/tasks";
import { ConflictError, NotFoundError, UnprocessableEntityError } from "@/lib/api";
import { applyInterestLevel } from "@/lib/personas/defaults";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { settingsRepo } from "@/lib/repositories/settingsRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { buildRetrievalContext } from "@/lib/retrieval/context";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { evaluationService } from "@/lib/services/evaluation";
import { companyResearchSchema } from "@/lib/types/domain";
import type { InterviewPlan, PanelInterviewer, CompanyResearch } from "@/lib/types/domain";
import { z } from "zod";

const COMPANY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const companyResearchCacheSchema = z.object({
  version: z.literal(1),
  cachedAt: z.number().int().nonnegative(),
  data: companyResearchSchema,
});

function getCompanyResearchCache(companyName: string): CompanyResearch | null {
  const cacheKey = `company_research:${companyName.toLowerCase().trim()}`;
  const cached = settingsRepo.getSettingParsed(cacheKey, companyResearchCacheSchema);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > COMPANY_CACHE_TTL_MS) return null;
  console.log(`[Cache] Company research HIT for "${companyName}"`);
  return cached.data;
}

function setCompanyResearchCache(companyName: string, data: CompanyResearch) {
  const cacheKey = `company_research:${companyName.toLowerCase().trim()}`;
  settingsRepo.upsertSetting(cacheKey, { version: 1, data, cachedAt: Date.now() });
}

function assignVoices(rawPanel: PanelInterviewer[]): PanelInterviewer[] {
  const hasElevenLabs = Boolean(getElevenLabsApiKey());
  if (!hasElevenLabs) return rawPanel;

  const genderCounters = { male: 0, female: 0 };
  return rawPanel.map((interviewer) => {
    const idx = genderCounters[interviewer.gender];
    genderCounters[interviewer.gender]++;
    const voiceConfig = assignVoiceToInterviewer(interviewer.gender, idx);
    return { ...interviewer, elevenLabsVoiceId: voiceConfig.voiceId };
  });
}

function buildSyntheticPersona(panel: PanelInterviewer[]) {
  const lead = panel[0];
  return applyInterestLevel({
    key: "neutral_manager" as const,
    name: lead?.name ?? "Interviewer",
    description: lead?.personality ?? "Professional interviewer",
    tone: lead?.tone ?? "professional",
    warmth: lead?.warmth ?? 55,
    skepticism: lead?.skepticism ?? 55,
    interruptionFrequency: 20,
    followUpIntensity: 60,
    challengeStyle: lead?.challengeStyle ?? ("balanced" as const),
    focusAreas: lead?.focusAreas ?? ["ownership", "impact"],
    openingStyle: "professional",
    closingStyle: "concise",
  }, "medium");
}

export const interviewsService = {
  async generateInterviewPlan(input: {
    candidateProfileId: string;
    jobDocumentId: string;
    companyName: string;
    panelSize: 1 | 2 | 3;
    interviewType: "recruiter_screen" | "hiring_manager" | "behavioral" | "technical_general" | "system_design_light";
    difficulty: "easy" | "realistic" | "hard";
    durationMinutes: 5 | 10 | 15;
  }) {
    ensureDatabaseReady();

    const resume = documentsRepo
      .listDocumentsForProfile(input.candidateProfileId, "resume")
      .find((doc) => Boolean(doc.parsedJson));
    const jobDocument = documentsRepo.getDocumentById(input.jobDocumentId);
    if (!jobDocument || jobDocument.candidateProfileId !== input.candidateProfileId) {
      throw new NotFoundError("Job description not found for this profile.");
    }
    if (jobDocument.type !== "job_description") {
      throw new ConflictError("Selected document is not a job description.");
    }
    if (!resume?.parsedJson) {
      throw new UnprocessableEntityError("Resume must be parsed before planning.");
    }
    if (!jobDocument.parsedJson) {
      throw new UnprocessableEntityError("Job description must be parsed before planning.");
    }

    const resumeProfile = resume.parsedJson as never;
    const jobAnalysis = jobDocument.parsedJson as never;
    const jobTitle = (jobAnalysis as { titleGuess?: string }).titleGuess ?? input.interviewType;
    const jobDescriptionContext = jobDocument.rawText?.slice(0, 1500);

    // --- Opt 4: Use cached company research if available ---
    let companyResearch = getCompanyResearchCache(input.companyName);
    if (!companyResearch) {
      companyResearch = await geminiTasks.researchCompany(
        input.companyName,
        jobTitle,
        jobDescriptionContext,
      );
      setCompanyResearchCache(input.companyName, companyResearch);
    }

    // --- Generate core panel ---
    const corePanel = await geminiTasks.generateCorePanel({
      companyResearch,
      jobAnalysis,
      resumeProfile,
      interviewType: input.interviewType,
      panelSize: input.panelSize,
    });

    const coreWithVoices = assignVoices(corePanel as PanelInterviewer[]);
    const persona = buildSyntheticPersona(coreWithVoices);

    // --- Opts 1 + 5: Run enrichment (if multi-interviewer) and plan in parallel ---
    const needsEnrichment = input.panelSize > 1;
    const companyName = companyResearch.confirmedName ?? "the company";

    const [enrichments, plan] = await Promise.all([
      needsEnrichment
        ? geminiTasks.enrichPanel(
            corePanel.map((c) => ({ key: c.key, name: c.name, role: c.role, personality: c.personality, gender: c.gender, warmth: c.warmth, challengeStyle: c.challengeStyle, focusAreas: c.focusAreas })),
            companyName,
            jobTitle,
          )
        : Promise.resolve(null),
      geminiTasks.buildPlan({
        interviewType: input.interviewType,
        difficulty: input.difficulty,
        interestLevel: "medium",
        durationMinutes: input.durationMinutes,
        persona,
        resume: resumeProfile,
        job: jobAnalysis,
        companyResearch,
        panel: coreWithVoices,
      } as never),
    ]);

    // Merge enrichments into panel if available
    let panel = coreWithVoices;
    if (enrichments) {
      const enrichmentMap = new Map(enrichments.map((e: { key: string }) => [e.key, e]));
      panel = coreWithVoices.map((core) => {
        const enrichment = enrichmentMap.get(core.key) ?? {};
        return { ...core, ...enrichment } as PanelInterviewer;
      });
      console.log(`[Panel] Enriched ${panel.length} interviewers`);
    } else {
      console.log("[Panel] Solo interviewer - skipped enrichment");
    }

    const defaultPersona = personasRepo.getPersonaByKey("neutral_manager");
    if (!defaultPersona) {
      throw new Error("Default persona not found.");
    }

    const session = interviewsRepo.createSession({
      candidateProfileId: input.candidateProfileId,
      personaId: defaultPersona.id,
      interviewType: input.interviewType,
      difficulty: input.difficulty,
      interestLevel: "medium",
      mode: "text",
      durationMinutes: input.durationMinutes,
      status: "planned",
      resumeDocumentId: resume.id,
      jobDocumentId: input.jobDocumentId,
      companyName: input.companyName,
      companyContextJson: JSON.stringify(companyResearch),
      panelJson: JSON.stringify(panel),
      planJson: JSON.stringify(plan),
      startedAt: null,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: undefined!,
    } as never);

    if (!session) {
      throw new Error("Failed to create session.");
    }

    return {
      session,
      plan,
      panel,
      companyResearch,
    };
  },

  startInterview(sessionId: string) {
    ensureDatabaseReady();
    const existingSession = interviewsRepo.getSessionById(sessionId);
    if (!existingSession) {
      throw new NotFoundError("Session not found.");
    }
    if (existingSession.status === "completed" || existingSession.status === "cancelled") {
      throw new ConflictError("Session can no longer be started.");
    }

    if (existingSession.status === "active") {
      const existingTurns = transcriptRepo.listTurnsForSession(sessionId);
      const firstAgentTurn = existingTurns.find((turn) => turn.speaker === "agent");
      const panel = (existingSession.panelJson ?? []) as PanelInterviewer[];
      return {
        firstMessage: firstAgentTurn?.text
          ?? panel[0]?.openingMessage
          ?? "Interview already started.",
        interviewerKey: firstAgentTurn?.interviewerKey ?? panel[0]?.key ?? "interviewer_1",
        session: existingSession,
        panel,
      };
    }

    const session = interviewsRepo.markSessionStartedIfPlanned(sessionId);
    if (!session) {
      throw new ConflictError("Session could not be started.");
    }

    const panel = (session.panelJson ?? []) as PanelInterviewer[];
    const leadInterviewer = panel[0];
    const interviewerKey = leadInterviewer?.key ?? "interviewer_1";

    const firstMessage = leadInterviewer?.openingMessage
      ?? `Hi, I'm ${leadInterviewer?.name ?? "your interviewer"} - ${leadInterviewer?.role ?? "the interviewer for today"}. Thanks for taking the time to speak with us. I've had a look at your background and I'd love to start with a quick overview - could you walk me through your experience and what brought you to this opportunity?`;

    try {
      transcriptRepo.appendTurn({
        interviewSessionId: sessionId,
        speaker: "agent",
        text: firstMessage,
        questionCategory: "opening",
        interviewerKey,
      });
    } catch (error) {
      interviewsRepo.markSessionPlannedIfActive(sessionId);
      throw error;
    }

    return {
      firstMessage,
      interviewerKey,
      session,
      panel,
    };
  },

  async nextTurn(sessionId: string, candidateMessage: string) {
    ensureDatabaseReady();
    const session = interviewsRepo.getSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Session not found.");
    }
    if (session.status !== "active") {
      throw new ConflictError("Session is not active.");
    }

    const candidateTurn = transcriptRepo.appendTurn({
      interviewSessionId: sessionId,
      speaker: "candidate",
      text: candidateMessage,
    });

    const panel = (session.panelJson ?? []) as PanelInterviewer[];
    const companyResearch = (session.companyContextJson ?? null) as CompanyResearch | null;
    const planJson = session.planJson as InterviewPlan | null;

    try {
      const turns = transcriptRepo.listTurnsForSession(sessionId);
      const agentTurns = turns.filter((turn) => turn.speaker === "agent");
      const remainingQuestions = Math.max(
        0,
        (planJson?.starterQuestions?.length ?? 4) - agentTurns.length,
      );
      const followUpsUsed = turns.filter(
        (turn) =>
          turn.speaker === "agent" &&
          /specific|metric|measure|why|tradeoff|detail|exactly/i.test(turn.text),
      ).length;
      const contextSnippets = buildRetrievalContext(session.candidateProfileId, candidateMessage);

      const response = await geminiTasks.nextTurn({
        sessionObjective:
          planJson?.sessionObjective ?? "Assess role fit, ownership, and communication.",
        interviewType: session.interviewType,
        difficulty: session.difficulty,
        recentTranscript: turns.slice(-TURN_HISTORY_WINDOW).map((turn) => ({
          speaker: turn.speaker,
          text: turn.text,
          interviewerKey: turn.interviewerKey,
        })),
        contextSnippets,
        remainingQuestions,
        followUpBudget: Math.max(0, FOLLOW_UP_CAP - followUpsUsed),
        panel,
        companyResearch: companyResearch ?? undefined,
      });

      const latestSession = interviewsRepo.getSessionById(sessionId);
      if (!latestSession || latestSession.status !== "active") {
        throw new ConflictError("Session is no longer active.");
      }

      const interviewerKey = response.interviewerKey ?? panel[0]?.key ?? "interviewer_1";

      transcriptRepo.appendTurn({
        interviewSessionId: sessionId,
        speaker: "agent",
        text: response.agentMessage,
        questionCategory: response.questionCategory,
        interviewerKey,
      });

      return { ...response, interviewerKey };
    } catch (error) {
      transcriptRepo.deleteTurn(candidateTurn.id);
      throw error;
    }
  },

  async finishInterview(sessionId: string) {
    ensureDatabaseReady();
    const session = interviewsRepo.getSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Session not found.");
    }
    const existingScore = scoresRepo.getScoreForSession(sessionId);
    if (session.status === "completed" || existingScore) {
      if (session.status === "active" && existingScore) {
        interviewsRepo.markSessionCompletedIfActive(sessionId);
      }
      return {
        reviewReady: true,
      };
    }
    if (session.status !== "active") {
      throw new ConflictError("Only active sessions can be finished.");
    }

    const evaluation = await evaluationService.evaluateCompletedSession(sessionId);
    const coaching = await geminiTasks.coachSession({
      transcript: evaluation.transcript,
      evaluation: evaluation.evaluation,
    });

    const currentSession = interviewsRepo.getSessionById(sessionId);
    if (!currentSession || currentSession.status !== "active") {
      throw new ConflictError("Session is no longer active.");
    }

    const sqlite = getSqliteClient();
    sqlite.transaction(() => {
      evaluationService.persistReview({
        sessionId,
        evaluation: evaluation.evaluation,
        band: evaluation.band,
        coaching,
      });
      const completedSession = interviewsRepo.markSessionCompletedIfActive(sessionId);
      if (!completedSession) {
        throw new ConflictError("Session could not be marked completed.");
      }
    })();

    return {
      reviewReady: true,
    };
  },
};
