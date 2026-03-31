import { UnprocessableEntityError, handleRouteError, ok } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { interviewsService } from "@/lib/services/interviews";
import { interviewPlanRequestSchema } from "@/lib/validation/interview";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "interviews:plan", 10, 60_000);
    const body = interviewPlanRequestSchema.parse(await request.json());
    const result = await interviewsService.generateInterviewPlan(body);
    return ok({ sessionId: result.session.id, plan: result.plan });
  } catch (error) {
    if (error instanceof Error && /must be parsed before planning/i.test(error.message)) {
      return handleRouteError(new UnprocessableEntityError(error.message));
    }
    return handleRouteError(error);
  }
}
