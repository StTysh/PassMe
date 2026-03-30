import { FOLLOW_UP_CAP, TURN_HISTORY_WINDOW } from "@/lib/constants";
import { geminiTasks } from "@/lib/gemini/tasks";
import { applyInterestLevel } from "@/lib/personas/defaults";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { buildRetrievalContext } from "@/lib/retrieval/context";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { evaluationService } from "@/lib/services/evaluation";

export const interviewsService = {
  async generateInterviewPlan(input: {
    candidateProfileId: string;
    jobDocumentId: string;
    personaKey: "warm_recruiter" | "skeptical_manager" | "neutral_manager" | "detail_oriented_interviewer";
    interviewType: "recruiter_screen" | "hiring_manager" | "behavioral" | "technical_general" | "system_design_light";
    difficulty: "easy" | "realistic" | "hard";
    interestLevel: "low" | "medium" | "high";
    durationMinutes: 5 | 10 | 15;
  }) {
    ensureDatabaseReady();
    const persona = personasRepo.getPersonaByKey(input.personaKey);
    if (!persona) {
      throw new Error("Persona not found.");
    }

    const resume = documentsRepo.listDocumentsForProfile(input.candidateProfileId, "resume")[0];
    const jobDocument = documentsRepo.getDocumentById(input.jobDocumentId);
    if (!resume?.parsedJson) {
      throw new Error("Resume must be parsed before planning.");
    }
    if (!jobDocument?.parsedJson) {
      throw new Error("Job description must be parsed before planning.");
    }

    const adjustedPersona = applyInterestLevel(persona.configJson, input.interestLevel);
    const plan = await geminiTasks.buildPlan({
      interviewType: input.interviewType,
      difficulty: input.difficulty,
      interestLevel: input.interestLevel,
      durationMinutes: input.durationMinutes,
      persona: adjustedPersona,
      resume: resume.parsedJson as never,
      job: jobDocument.parsedJson as never,
    } as never);

    const session = interviewsRepo.createSession({
      candidateProfileId: input.candidateProfileId,
      personaId: persona.id,
      interviewType: input.interviewType,
      difficulty: input.difficulty,
      interestLevel: input.interestLevel,
      mode: "text",
      durationMinutes: input.durationMinutes,
      status: "planned",
      jobDocumentId: input.jobDocumentId,
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
    };
  },

  startInterview(sessionId: string) {
    ensureDatabaseReady();
    const session = interviewsRepo.markSessionStarted(sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    const plan = session.planJson;
    const firstMessage =
      plan?.starterQuestions[0]?.question ??
      "Thanks for joining. Let's start with a quick overview of your background.";
    transcriptRepo.appendTurn({
      interviewSessionId: sessionId,
      speaker: "agent",
      text: firstMessage,
      questionCategory: plan?.starterQuestions[0]?.category ?? "opening",
    });
    return {
      firstMessage,
      session,
    };
  },

  async nextTurn(sessionId: string, candidateMessage: string) {
    ensureDatabaseReady();
    const session = interviewsRepo.getSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    if (session.status !== "active") {
      throw new Error("Session is not active.");
    }

    transcriptRepo.appendTurn({
      interviewSessionId: sessionId,
      speaker: "candidate",
      text: candidateMessage,
    });

    const persona = personasRepo.listPersonas().find((item) => item.id === session.personaId);
    if (!persona) {
      throw new Error("Persona not found.");
    }
    const personaConfig = {
      key: persona.key,
      name: persona.name,
      description: persona.description,
      ...persona.configJson,
    };

    const turns = transcriptRepo.listTurnsForSession(sessionId);
    const agentTurns = turns.filter((turn) => turn.speaker === "agent");
    const remainingQuestions = Math.max(
      0,
      (session.planJson?.starterQuestions.length ?? 4) - agentTurns.length,
    );
    const followUpsUsed = turns.filter(
      (turn) =>
        turn.speaker === "agent" &&
        /specific|metric|measure|why|tradeoff|detail|exactly/i.test(turn.text),
    ).length;
    const contextSnippets = buildRetrievalContext(session.candidateProfileId, candidateMessage);

    const response = await geminiTasks.nextTurn({
      persona: personaConfig,
      sessionObjective:
        session.planJson?.sessionObjective ?? "Assess role fit, ownership, and communication.",
      interviewType: session.interviewType as
        | "recruiter_screen"
        | "hiring_manager"
        | "behavioral"
        | "technical_general"
        | "system_design_light",
      difficulty: session.difficulty as "easy" | "realistic" | "hard",
      interestLevel: session.interestLevel as "low" | "medium" | "high",
      recentTranscript: turns.slice(-TURN_HISTORY_WINDOW).map((turn) => ({
        speaker: turn.speaker,
        text: turn.text,
      })),
      contextSnippets,
      remainingQuestions,
      followUpBudget: Math.max(0, FOLLOW_UP_CAP - followUpsUsed),
    } as never);

    transcriptRepo.appendTurn({
      interviewSessionId: sessionId,
      speaker: "agent",
      text: response.agentMessage,
      questionCategory: response.questionCategory,
    });

    return response;
  },

  async finishInterview(sessionId: string) {
    ensureDatabaseReady();
    const evaluation = await evaluationService.evaluateCompletedSession(sessionId);
    const coaching = await geminiTasks.coachSession({
      transcript: evaluation.transcript,
      evaluation: evaluation.evaluation,
    });

    evaluationService.persistReview({
      sessionId,
      evaluation: evaluation.evaluation,
      band: evaluation.band,
      coaching,
    });
    interviewsRepo.markSessionCompleted(sessionId);

    return {
      reviewReady: true,
    };
  },
};
