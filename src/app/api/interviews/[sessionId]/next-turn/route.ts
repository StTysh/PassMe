import { handleRouteError, ok } from "@/lib/api";
import { interviewsService } from "@/lib/services/interviews";
import { nextTurnSchema } from "@/lib/validation/interview";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = nextTurnSchema.parse(await request.json());
    const result = await interviewsService.nextTurn(sessionId, body.candidateMessage);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
