import { handleRouteError, ok } from "@/lib/api";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    ensureDatabaseReady();
    const { sessionId } = await params;
    const score = scoresRepo.getScoreForSession(sessionId);
    if (!score) {
      throw new Error("Review is not available yet.");
    }
    const feedback = scoresRepo.listFeedbackItems(sessionId);
    const transcript = transcriptRepo.listTurnsForSession(sessionId);
    return ok({
      scores: {
        overallScore: score.overallScore,
        band: score.band,
        summary: score.summary,
        dimensionScores: {
          clarity: score.clarityScore,
          relevance: score.relevanceScore,
          evidence: score.evidenceScore,
          structure: score.structureScore,
          roleFit: score.roleFitScore,
          confidence: score.confidenceScore,
        },
      },
      feedback: {
        strengths: feedback.filter((item) => item.category === "strength"),
        weaknesses: feedback.filter((item) => item.category === "weakness"),
        missedPoints: feedback.filter((item) => item.category === "missed_point"),
        rewrittenAnswers: feedback.filter((item) => item.category === "rewritten_answer"),
        nextSteps: feedback.filter((item) => item.category === "next_step"),
      },
      transcript,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
