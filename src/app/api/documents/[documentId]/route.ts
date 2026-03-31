import { handleRouteError, ok } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { documentsService } from "@/lib/services/documents";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    assertRateLimit(request, "documents:delete", 20, 60_000);
    const { documentId } = await params;
    documentsService.deleteDocument(documentId);
    return ok({ documentId });
  } catch (error) {
    return handleRouteError(error);
  }
}
