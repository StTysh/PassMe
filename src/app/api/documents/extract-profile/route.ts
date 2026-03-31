import { handleRouteError, ok } from "@/lib/api";
import { geminiTasks } from "@/lib/gemini/tasks";
import { extractPdfText } from "@/lib/parser/pdf";
import { normalizeDocumentText } from "@/lib/parser/documents";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    ensureDatabaseReady();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: "No file provided" }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText =
      file.type === "application/pdf"
        ? await extractPdfText(buffer)
        : buffer.toString("utf8");

    rawText = normalizeDocumentText(rawText);

    if (!rawText || rawText.length < 20) {
      return new Response(
        JSON.stringify({ ok: false, error: "Could not extract text from file" }),
        { status: 400 },
      );
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
