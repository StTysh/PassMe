import { NotFoundError, handleRouteError, ok } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    ensureDatabaseReady();
    assertRateLimit(_request, "interviews:cancel", 20, 60_000);
    const { sessionId } = await params;
    const session = interviewsRepo.getSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Session not found.");
    }
    if (session.status === "completed" || session.status === "cancelled") {
      return ok({ cancelled: true, alreadyFinished: true });
    }
    const cancelled = interviewsRepo.markSessionCancelledIfActiveOrPlanned(sessionId);
    if (!cancelled) {
      return ok({ cancelled: true, alreadyFinished: true });
    }
    return ok({ cancelled: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
