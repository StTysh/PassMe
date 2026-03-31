import { ConflictError, handleRouteError, ok } from "@/lib/api";
import { isDemoModeEnabled } from "@/lib/env";
import { assertRateLimit } from "@/lib/rate-limit";
import { resetAllData } from "@/lib/services/demo";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "settings:reset-demo", 3, 60_000);
    if (!isDemoModeEnabled) {
      throw new ConflictError("Demo reset is disabled.");
    }
    resetAllData();
    return ok({ reset: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
