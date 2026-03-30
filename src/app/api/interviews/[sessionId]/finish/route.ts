import { handleRouteError, ok } from "@/lib/api";
import { interviewsService } from "@/lib/services/interviews";
import { finishInterviewSchema } from "@/lib/validation/interview";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    finishInterviewSchema.parse(await request.json());
    const result = await interviewsService.finishInterview(sessionId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
