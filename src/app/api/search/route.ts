import { handleRouteError, ok } from "@/lib/api";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { searchQuerySchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  try {
    ensureDatabaseReady();
    const url = new URL(request.url);
    const query = searchQuerySchema.parse({
      q: url.searchParams.get("q"),
      profileId: url.searchParams.get("profileId") ?? undefined,
      scope: url.searchParams.get("scope") ?? undefined,
    });

    const results = [];
    if (query.scope === "documents" || query.scope === "all") {
      results.push(
        ...documentsRepo
          .searchDocuments(query.q, query.profileId)
          .map((item) => ({ scope: "document", item })),
      );
    }

    if (query.scope === "transcripts" || query.scope === "all") {
      results.push(
        ...transcriptRepo.searchTranscript(query.q).map((item) => ({
          scope: "transcript",
          item,
        })),
      );
    }

    return ok({ results });
  } catch (error) {
    return handleRouteError(error);
  }
}
