import { handleRouteError, ok } from "@/lib/api";
import { documentsService } from "@/lib/services/documents";
import { parseDocumentSchema } from "@/lib/validation/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = parseDocumentSchema.parse(await request.json());
    const parsed =
      body.parseMode === "resume"
        ? await documentsService.parseResumeDocument(body.documentId)
        : await documentsService.parseJobDocument(body.documentId);

    return ok({ documentId: body.documentId, parsed });
  } catch (error) {
    return handleRouteError(error);
  }
}
