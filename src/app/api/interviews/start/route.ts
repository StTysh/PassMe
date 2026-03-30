import { handleRouteError, ok } from "@/lib/api";
import { interviewsService } from "@/lib/services/interviews";
import { startInterviewSchema } from "@/lib/validation/interview";

export async function POST(request: Request) {
  try {
    const body = startInterviewSchema.parse(await request.json());
    const result = interviewsService.startInterview(body.sessionId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
