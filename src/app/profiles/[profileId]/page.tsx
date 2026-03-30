import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentUploadPanel } from "@/components/profiles/document-upload-panel";
import { ParsedResumeCard } from "@/components/profiles/parsed-resume-card";
import { ProfileSummary } from "@/components/profiles/profile-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentList } from "@/components/upload/document-list";
import { profilesService } from "@/lib/services/profiles";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workspace.profile.fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resume, target job, and session history live together here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/profiles/${workspace.profile.id}/edit`}>Edit profile</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/interviews/new">Start interview</Link>
          </Button>
        </div>
      </div>

      <ProfileSummary profile={workspace.profile} />

      <div className="grid gap-4 xl:grid-cols-2">
        <DocumentUploadPanel profileId={workspace.profile.id} />
        <ParsedResumeCard parsed={parsedResume as Record<string, unknown> | null} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
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
