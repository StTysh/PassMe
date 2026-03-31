import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api";
import { geminiTasks } from "@/lib/gemini/tasks";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

const resolveRequestSchema = z.object({
  companyName: z.string().trim().min(1),
  jobTitle: z.string().trim().min(1).optional(),
  jobDocumentId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    ensureDatabaseReady();
    const body = resolveRequestSchema.parse(await request.json());

    let jobDescriptionSnippet: string | undefined;
    if (body.jobDocumentId) {
      const jobDoc = documentsRepo.getDocumentById(body.jobDocumentId);
      if (jobDoc?.rawText) {
        jobDescriptionSnippet = jobDoc.rawText.slice(0, 500);
      }
    }

    const resolution = await geminiTasks.resolveCompany(
      body.companyName,
      body.jobTitle ?? "the target position",
      jobDescriptionSnippet,
    );

    return ok({ resolution });
  } catch (error) {
    return handleRouteError(error);
  }
}
