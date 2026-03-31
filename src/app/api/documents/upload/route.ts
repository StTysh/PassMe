import { documentsService } from "@/lib/services/documents";
import { documentUploadSchema } from "@/lib/validation/documents";
import { PayloadTooLargeError, handleRouteError, ok } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MULTIPART_BODY_BYTES = 12 * 1024 * 1024;

function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "documents:upload", 20, 60_000);
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const contentLength = Number(request.headers.get("content-length") ?? "0");
      if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BODY_BYTES) {
        throw new PayloadTooLargeError("Uploaded file exceeds the 10 MB limit.");
      }

      const formData = await request.formData();
      const body = documentUploadSchema.parse({
        candidateProfileId: getOptionalFormValue(formData, "candidateProfileId"),
        type: getOptionalFormValue(formData, "type"),
        title: getOptionalFormValue(formData, "title"),
        text: getOptionalFormValue(formData, "text"),
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
