import { documentsService } from "@/lib/services/documents";
import { documentUploadSchema } from "@/lib/validation/documents";
import { handleRouteError, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const body = documentUploadSchema.parse({
        candidateProfileId: formData.get("candidateProfileId"),
        type: formData.get("type"),
        title: formData.get("title"),
        text: formData.get("text"),
      });
      const file = formData.get("file");
      const document = await documentsService.storeUploadedDocument({
        ...body,
        file: file instanceof File ? file : undefined,
      });
      return ok({ documentId: document.id, type: document.type, title: document.title });
    }

    const body = documentUploadSchema.parse(await request.json());
    const document = await documentsService.storeUploadedDocument(body);
    return ok({ documentId: document.id, type: document.type, title: document.title });
  } catch (error) {
    return handleRouteError(error);
  }
}
