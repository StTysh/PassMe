import { handleRouteError, ok } from "@/lib/api";
import { historyService } from "@/lib/services/history";
import { historyFilterSchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = historyFilterSchema.parse({
      profileId: url.searchParams.get("profileId") ?? undefined,
      interviewType: url.searchParams.get("interviewType") ?? undefined,
      personaKey: url.searchParams.get("personaKey") ?? undefined,
    });
    return ok(historyService.getHistorySummary(filters));
  } catch (error) {
    return handleRouteError(error);
  }
}
