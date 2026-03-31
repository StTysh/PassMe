import { z } from "zod";
import { ConflictError, NotFoundError, UnprocessableEntityError, handleRouteError, ok } from "@/lib/api";
import { geminiTasks } from "@/lib/gemini/tasks";
import { assertRateLimit } from "@/lib/rate-limit";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

const resolveRequestSchema = z.object({
  companyName: z.string().trim().min(1),
  candidateProfileId: z.string().trim().min(1),
  jobTitle: z.string().trim().min(1).optional(),
  jobDocumentId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    ensureDatabaseReady();
    assertRateLimit(request, "company:resolve", 15, 60_000);
    const body = resolveRequestSchema.parse(await request.json());

    let jobDescriptionSnippet: string | undefined;
    if (body.jobDocumentId) {
      const jobDoc = documentsRepo.getDocumentById(body.jobDocumentId);
      if (!jobDoc || jobDoc.candidateProfileId !== body.candidateProfileId) {
        throw new NotFoundError("Job description not found for this profile.");
      }
      if (jobDoc.type !== "job_description") {
        throw new ConflictError("Selected document is not a job description.");
      }
      if (!jobDoc.rawText.trim()) {
        throw new UnprocessableEntityError("Selected job description has no readable text.");
      }

      jobDescriptionSnippet = jobDoc.rawText.slice(0, 500);
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
