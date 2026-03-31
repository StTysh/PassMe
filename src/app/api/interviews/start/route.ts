import { handleRouteError, ok } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { interviewsService } from "@/lib/services/interviews";
import { startInterviewSchema } from "@/lib/validation/interview";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "interviews:start", 20, 60_000);
    const body = startInterviewSchema.parse(await request.json());
    const result = interviewsService.startInterview(body.sessionId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
