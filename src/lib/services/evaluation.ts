import { bandForScore, computeOverallScore } from "@/lib/scoring/rubric";
import { normalizeDimensionScores } from "@/lib/scoring/normalize";
import { geminiTasks } from "@/lib/gemini/tasks";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import type { CoachingPayload, EvaluationPayload } from "@/lib/types/domain";

export const evaluationService = {
  async evaluateCompletedSession(sessionId: string) {
    ensureDatabaseReady();
    const session = interviewsRepo.getSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const turns = transcriptRepo.listTurnsForSession(sessionId);
    const transcript = turns.map((turn) => `${turn.speaker}: ${turn.text}`).join("\n");
    const resume = session.candidateProfileId
      ? documentsRepo.listDocumentsForProfile(session.candidateProfileId, "resume")[0]
      : null;
    const job = session.jobDocumentId ? documentsRepo.getDocumentById(session.jobDocumentId) : null;

    const evaluation = await geminiTasks.evaluateSession({
      transcript,
      resume: (resume?.parsedJson ?? {}) as never,
      job: (job?.parsedJson ?? {}) as never,
      interviewType: session.interviewType,
    });

    const dimensionScores = normalizeDimensionScores(evaluation.dimensionScores);
    const overallScore = computeOverallScore(dimensionScores);
    return {
      evaluation: {
        ...evaluation,
        overallScore,
        dimensionScores,
      },
      band: bandForScore(overallScore),
      transcript,
    };
  },

  persistReview(input: {
    sessionId: string;
    evaluation: EvaluationPayload;
    band: string;
    coaching: CoachingPayload;
  }) {
    ensureDatabaseReady();

    scoresRepo.createScore({
      id: undefined!,
      interviewSessionId: input.sessionId,
      overallScore: input.evaluation.overallScore,
      clarityScore: input.evaluation.dimensionScores.clarity,
      relevanceScore: input.evaluation.dimensionScores.relevance,
      evidenceScore: input.evaluation.dimensionScores.evidence,
      structureScore: input.evaluation.dimensionScores.structure,
      roleFitScore: input.evaluation.dimensionScores.roleFit,
      confidenceScore: input.evaluation.dimensionScores.confidence,
      band: input.band,
      summary: input.evaluation.summary,
      createdAt: Date.now(),
    });

    scoresRepo.createFeedbackItems([
      ...input.evaluation.strengths.map((item) => ({
        interviewSessionId: input.sessionId,
        category: "strength",
        title: item.title,
        body: item.body,
        sourceTurnIdsJson: item.sourceTurnIndexes ?? null,
      })),
      ...input.evaluation.weaknesses.map((item) => ({
        interviewSessionId: input.sessionId,
        category: "weakness",
        title: item.title,
        body: item.body,
        severity: item.severity,
        sourceTurnIdsJson: item.sourceTurnIndexes ?? null,
      })),
      ...input.evaluation.missedPoints.map((item) => ({
        interviewSessionId: input.sessionId,
        category: "missed_point",
        title: item.title,
        body: item.body,
      })),
      ...input.coaching.rewrittenAnswers.map((item) => ({
        interviewSessionId: input.sessionId,
        category: "rewritten_answer",
        title: item.title,
        body: item.improvedAnswer,
      })),
      ...input.coaching.nextSteps.map((item) => ({
        interviewSessionId: input.sessionId,
        category: "next_step",
        title: item.title,
        body: item.body,
      })),
    ]);
  },
};
