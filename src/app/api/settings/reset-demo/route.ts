import { handleRouteError, ok } from "@/lib/api";
import { resetAllData } from "@/lib/services/demo";

export async function POST() {
  try {
    resetAllData();
    return ok({ reset: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
