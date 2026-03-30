import { PlannerFormClient } from "@/components/interviews/planner-form-client";
import { EmptyState } from "@/components/empty-state";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { profilesService } from "@/lib/services/profiles";

export const dynamic = "force-dynamic";

export default function InterviewSetupPage() {
  const profiles = profilesService.listProfiles();
  const jobs = profiles.flatMap((profile) =>
    documentsRepo.listDocumentsForProfile(profile.id, "job_description").map((document) => ({
      id: document.id,
      title: document.title ?? "Job description",
      candidateProfileId: profile.id,
    })),
  );
  const personas = personasRepo.listPersonas().map((persona) => ({
    key: persona.key,
    name: persona.name,
    description: persona.description,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interview setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a parsed candidate and target role, then generate a role-aware plan.
        </p>
      </div>

      {profiles.length && jobs.length ? (
        <PlannerFormClient profiles={profiles} jobs={jobs} personas={personas} />
      ) : (
        <EmptyState
          eyebrow="Setup blocked"
          title="Create a profile and add a parsed job description first."
          description="Interview plans depend on a candidate profile, a parsed resume, and a parsed job description."
          actionHref="/profiles/new"
          actionLabel="Create profile"
        />
      )}
    </div>
  );
}
