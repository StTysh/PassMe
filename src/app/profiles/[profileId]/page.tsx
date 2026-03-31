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

  const resumeDocument = workspace.documents.find((d) => d.type === "resume") ?? null;
  const jobDocument = workspace.documents.find((d) => d.type === "job_description") ?? null;
  const hasResume = Boolean(resumeDocument);
  const hasJob = Boolean(jobDocument);
  const hasParsedResume = Boolean(resumeDocument?.parsedJson);
  const hasParsedJob = Boolean(jobDocument?.parsedJson);
  const canInterview = hasParsedResume && hasParsedJob;

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
            To start an interview, make sure you have{" "}
            {!hasResume && !hasJob
              ? "a parsed resume and a parsed job description"
              : !hasResume
                ? "a parsed resume"
                : !hasJob
                  ? "a parsed job description"
                  : !hasParsedResume
                    ? "a parsed resume"
                    : "a parsed job description"}{" "}
            available below. If a document failed to parse, delete it and upload it again.
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
            <Badge variant={hasParsedResume ? "success" : "outline"}>
              {hasParsedResume ? "Resume ready" : "Resume missing"}
            </Badge>
            <Badge variant={hasParsedJob ? "success" : "outline"}>
              {hasParsedJob ? "Job ready" : "Job missing"}
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
            allowDelete
          />
        </CardContent>
      </Card>
    </div>
  );
}
