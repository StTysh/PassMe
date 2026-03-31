import Link from "next/link";

import { PlannerFormClient } from "@/components/interviews/planner-form-client";
import { EmptyState } from "@/components/empty-state";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { profilesService } from "@/lib/services/profiles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InterviewSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const { profileId: preselectedProfileId } = await searchParams;

  const profiles = profilesService.listProfiles();
  const jobs = profiles.flatMap((profile) =>
    documentsRepo.listDocumentsForProfile(profile.id, "job_description").map((document) => ({
      id: document.id,
      title: document.title ?? "Job description",
      candidateProfileId: profile.id,
    })),
  );
  const hasProfiles = profiles.length > 0;
  const hasJobs = jobs.length > 0;
  const ready = hasProfiles && hasJobs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interview setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a parsed candidate and target role, then generate a role-aware plan.
        </p>
      </div>

      {ready ? (
        <PlannerFormClient
          profiles={profiles}
          jobs={jobs}
          defaultProfileId={preselectedProfileId}
        />
      ) : (
        <div className="space-y-4">
          <EmptyState
            eyebrow="Setup checklist"
            title="A few things are needed before you can start."
            description="Interview plans need a candidate profile with a parsed resume and a parsed job description. Complete the steps below."
          />

          <Card>
            <CardContent className="divide-y divide-border p-0">
              <SetupStep
                done={hasProfiles}
                label="Create a candidate profile"
                description="Add your name, headline, and target roles."
                href="/profiles/new"
                actionLabel="Create profile"
              />
              <SetupStep
                done={hasJobs}
                label="Upload a job description"
                description={
                  hasProfiles
                    ? "Go to your profile and upload the job posting you're targeting."
                    : "Create a profile first, then upload a job description to it."
                }
                href={
                  hasProfiles
                    ? `/profiles/${profiles[0].id}`
                    : "/profiles/new"
                }
                actionLabel={hasProfiles ? "Open profile" : "Create profile first"}
                disabled={!hasProfiles}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SetupStep({
  done,
  label,
  description,
  href,
  actionLabel,
  disabled,
}: {
  done: boolean;
  label: string;
  description: string;
  href: string;
  actionLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 sm:p-5">
      <div className="shrink-0">
        {done ? (
          <CheckCircle2 className="size-5 text-emerald-400" />
        ) : (
          <Circle className="size-5 text-muted-foreground/40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${done ? "text-muted-foreground line-through" : ""}`}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {done ? (
        <Badge variant="success">Done</Badge>
      ) : (
        <Button asChild variant="outline" size="sm" disabled={disabled}>
          <Link href={href}>
            {actionLabel}
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}
