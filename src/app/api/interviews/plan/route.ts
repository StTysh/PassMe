import { handleRouteError, ok } from "@/lib/api";
import { interviewsService } from "@/lib/services/interviews";
import { interviewPlanRequestSchema } from "@/lib/validation/interview";

export async function POST(request: Request) {
  try {
    const body = interviewPlanRequestSchema.parse(await request.json());
    const result = await interviewsService.generateInterviewPlan(body);
    return ok({ sessionId: result.session.id, plan: result.plan });
  } catch (error) {
    return handleRouteError(error);
  }
}
