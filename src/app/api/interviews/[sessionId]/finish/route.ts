import { handleRouteError, ok } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { interviewsService } from "@/lib/services/interviews";
import { finishInterviewSchema } from "@/lib/validation/interview";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    assertRateLimit(request, "interviews:finish", 10, 60_000);
    const { sessionId } = await params;
    finishInterviewSchema.parse(await request.json());
    const result = await interviewsService.finishInterview(sessionId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
