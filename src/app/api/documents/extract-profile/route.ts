import {
  BadRequestError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  UnprocessableEntityError,
  handleRouteError,
  ok,
} from "@/lib/api";
import { geminiTasks } from "@/lib/gemini/tasks";
import { extractPdfText } from "@/lib/parser/pdf";
import { normalizeDocumentText } from "@/lib/parser/documents";
import { assertRateLimit } from "@/lib/rate-limit";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { validateExtractProfileFile } from "@/lib/validation/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    ensureDatabaseReady();
    assertRateLimit(request, "documents:extract-profile", 10, 60_000);
    const formData = await request.formData();
    const file = formData.get("file");
    let fileKind: { isPdf: boolean; isText: boolean };
    try {
      fileKind = validateExtractProfileFile(file instanceof File ? file : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid file.";
      if (/10 MB limit/i.test(message)) {
        throw new PayloadTooLargeError(message);
      }
      if (/Unsupported file type/i.test(message)) {
        throw new UnsupportedMediaTypeError(message);
      }
      if (/empty/i.test(message) || /No file provided/i.test(message)) {
        throw new BadRequestError(message);
      }
      throw new BadRequestError("Invalid file upload.");
    }

    const inputFile = file as File;
    const buffer = Buffer.from(await inputFile.arrayBuffer());
    let rawText =
      fileKind.isPdf
        ? await extractPdfText(buffer)
        : fileKind.isText
          ? buffer.toString("utf8")
          : "";

    rawText = normalizeDocumentText(rawText);

    if (!rawText) {
      throw new UnprocessableEntityError("Could not extract readable text from the file.");
    }

    if (rawText.length < 20) {
      throw new UnprocessableEntityError("Could not extract enough readable text from the file.");
    }

    const parsed = await geminiTasks.parseResume(rawText);

    return ok({
      extracted: {
        candidateName: parsed.candidateName ?? null,
        candidateEmail: parsed.candidateEmail ?? null,
        candidateHeadline: parsed.candidateHeadline ?? null,
        totalYearsExperience: parsed.totalYearsExperience ?? null,
        primaryDomain: parsed.primaryDomain ?? null,
        roles: (parsed.roles ?? []).map((r) => ({ title: r.title, company: r.company })),
      },
      rawTextLength: rawText.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
