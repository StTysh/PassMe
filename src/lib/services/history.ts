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

    const strongestDimension =
      mapped.length > 0
        ? dimensions
            .map((dimension) => ({
              dimension,
              avg:
                mapped.reduce((sum, session) => {
                  const score = session.score;
                  if (!score) return sum;
                  const key = `${dimension}Score` as const;
                  return sum + score[key];
                }, 0) / Math.max(mapped.filter((session) => session.score).length, 1),
            }))
            .sort((a, b) => b.avg - a.avg)[0]?.dimension ?? null
        : null;

    return {
      sessions: mapped,
      summary: {
        averageScore,
        completedSessions: mapped.filter((session) => session.status === "completed").length,
        strongestDimension,
        biggestImprovementArea: null,
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
