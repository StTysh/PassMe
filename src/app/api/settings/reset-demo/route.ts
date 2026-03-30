import { handleRouteError, ok } from "@/lib/api";
import { ensureDemoData } from "@/lib/services/demo";

export async function POST() {
  try {
    ensureDemoData();
    return ok({ reset: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
