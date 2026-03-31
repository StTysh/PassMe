import { handleRouteError, ok } from "@/lib/api";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    ensureDatabaseReady();
    const { sessionId } = await params;
    const session = interviewsRepo.getSessionById(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, error: "Session not found" }), { status: 404 });
    }
    if (session.status === "completed" || session.status === "cancelled") {
      return ok({ cancelled: true, alreadyFinished: true });
    }
    interviewsRepo.markSessionCancelled(sessionId);
    return ok({ cancelled: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
