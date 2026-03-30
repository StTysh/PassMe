import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { profilesRepo } from "@/lib/repositories/profilesRepo";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

const dimensions = [
  "clarity",
  "relevance",
  "evidence",
  "structure",
  "roleFit",
  "confidence",
] as const;

export const historyService = {
  getHistorySummary(filters?: {
    profileId?: string;
    interviewType?: string;
    personaKey?: string;
  }) {
    ensureDatabaseReady();
    const sessions = interviewsRepo.listSessions().filter((session) => {
      if (filters?.profileId && session.candidateProfileId !== filters.profileId) {
        return false;
      }
      if (filters?.interviewType && session.interviewType !== filters.interviewType) {
        return false;
      }
      if (filters?.personaKey) {
        const persona = personasRepo.listPersonas().find((item) => item.id === session.personaId);
        if (persona?.key !== filters.personaKey) {
          return false;
        }
      }
      return true;
    });

    const mapped = sessions.map((session) => {
      const profile = profilesRepo.getProfileById(session.candidateProfileId);
      const score = scoresRepo.getScoreForSession(session.id);
      const persona = personasRepo.listPersonas().find((item) => item.id === session.personaId);
      return {
        ...session,
        profileName: profile?.fullName ?? "Unknown profile",
        personaKey: persona?.key ?? "unknown",
        personaName: persona?.name ?? "Unknown persona",
        score,
      };
    });

    const completedScores = mapped
      .map((session) => session.score?.overallScore ?? null)
      .filter((score): score is number => score !== null);

    const averageScore =
      completedScores.length > 0
        ? Math.round(
            (completedScores.reduce((sum, value) => sum + value, 0) / completedScores.length) * 10,
          ) / 10
        : null;

    const scoredSessions = mapped.filter((session) => session.score);

    const dimensionAverages =
      scoredSessions.length > 0
        ? dimensions.map((dimension) => ({
            dimension,
            avg:
              scoredSessions.reduce((sum, session) => {
                const key = `${dimension}Score` as const;
                return sum + (session.score?.[key] ?? 0);
              }, 0) / scoredSessions.length,
          }))
        : [];

    const sorted = [...dimensionAverages].sort((a, b) => b.avg - a.avg);
    const strongestDimension = sorted[0] ?? null;
    const weakestDimension = sorted[sorted.length - 1] ?? null;

    const bestScore =
      completedScores.length > 0 ? Math.max(...completedScores) : null;
    const latestBand = scoredSessions[0]?.score?.band ?? null;

    return {
      sessions: mapped,
      summary: {
        averageScore,
        completedSessions: mapped.filter((session) => session.status === "completed").length,
        strongestDimension: strongestDimension
          ? { name: strongestDimension.dimension, avg: Math.round(strongestDimension.avg * 10) / 10 }
          : null,
        weakestDimension: weakestDimension && weakestDimension.dimension !== strongestDimension?.dimension
          ? { name: weakestDimension.dimension, avg: Math.round(weakestDimension.avg * 10) / 10 }
          : null,
        bestScore,
        latestBand,
        dimensionAverages: dimensionAverages.map((d) => ({
          dimension: d.dimension,
          avg: Math.round(d.avg * 10) / 10,
        })),
      },
    };
  },

  compareAgainstPrevious(sessionId: string) {
    ensureDatabaseReady();
    const session = interviewsRepo.getSessionById(sessionId);
    if (!session) {
      return null;
    }

    const currentScore = scoresRepo.getScoreForSession(sessionId);
    if (!currentScore) {
      return null;
    }

    const comparable = interviewsRepo
      .listComparableSessions(session.candidateProfileId, session.interviewType)
      .filter((item) => item.id !== session.id && item.status === "completed");

    const previous =
      comparable.find((item) => scoresRepo.getScoreForSession(item.id)) ??
      interviewsRepo
        .listSessionsForProfile(session.candidateProfileId)
        .find((item) => item.id !== session.id && item.status === "completed");

    if (!previous) {
      return null;
    }

    const previousScore = scoresRepo.getScoreForSession(previous.id);
    if (!previousScore) {
      return null;
    }

    const deltas = {
      clarity: currentScore.clarityScore - previousScore.clarityScore,
      relevance: currentScore.relevanceScore - previousScore.relevanceScore,
      evidence: currentScore.evidenceScore - previousScore.evidenceScore,
      structure: currentScore.structureScore - previousScore.structureScore,
      roleFit: currentScore.roleFitScore - previousScore.roleFitScore,
      confidence: currentScore.confidenceScore - previousScore.confidenceScore,
    };

    const biggestImprovementArea = Object.entries(deltas).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      deltaOverall: currentScore.overallScore - previousScore.overallScore,
      biggestImprovementArea,
      previousSessionId: previous.id,
    };
  },
};
