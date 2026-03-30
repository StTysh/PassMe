import Link from "next/link";
import { notFound } from "next/navigation";
import { BotMessageSquare, Edit } from "lucide-react";

import { DocumentUploadPanel } from "@/components/profiles/document-upload-panel";
import { ParsedResumeCard } from "@/components/profiles/parsed-resume-card";
import { ProfileSummary } from "@/components/profiles/profile-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentList } from "@/components/upload/document-list";
import { profilesService } from "@/lib/services/profiles";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const workspace = profilesService.getCandidateWorkspace(profileId);

  if (!workspace) {
    notFound();
  }

  const parsedResume =
    workspace.documents.find((document) => document.type === "resume")?.parsedJson ?? null;

  const hasResume = workspace.documents.some((d) => d.type === "resume");
  const hasJob = workspace.documents.some((d) => d.type === "job_description");
  const canInterview = hasResume && hasJob;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workspace.profile.fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resume, target job, and session history live together here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/profiles/${workspace.profile.id}/edit`}>
              <Edit className="mr-1.5 size-3.5" />
              Edit profile
            </Link>
          </Button>
          {canInterview ? (
            <Button asChild size="sm">
              <Link href={`/interviews/new?profileId=${workspace.profile.id}`}>
                <BotMessageSquare className="mr-1.5 size-3.5" />
                Start interview
              </Link>
            </Button>
          ) : (
            <Button size="sm" disabled>
              <BotMessageSquare className="mr-1.5 size-3.5" />
              Start interview
            </Button>
          )}
        </div>
      </div>

      {!canInterview && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium text-amber-400">Missing documents</p>
          <p className="mt-1 text-muted-foreground">
            To start an interview, upload{" "}
            {!hasResume && !hasJob
              ? "a resume and a job description"
              : !hasResume
                ? "a resume"
                : "a job description"}{" "}
            using the form below.
          </p>
        </div>
      )}

      <ProfileSummary profile={workspace.profile} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DocumentUploadPanel profileId={workspace.profile.id} />
        <ParsedResumeCard parsed={parsedResume as Record<string, unknown> | null} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Documents</CardTitle>
          <div className="flex gap-1.5">
            <Badge variant={hasResume ? "success" : "outline"}>
              {hasResume ? "Resume" : "No resume"}
            </Badge>
            <Badge variant={hasJob ? "success" : "outline"}>
              {hasJob ? "Job desc" : "No job desc"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentList
            documents={workspace.documents.map((document) => ({
              id: document.id,
              title: document.title ?? document.type,
              type: document.type,
              sourceFilename: document.sourceFilename ?? undefined,
              parsedStatus: document.parsedJson ? "Parsed" : "Raw",
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
