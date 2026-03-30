import { notFound } from "next/navigation";

import { ProfileForm } from "@/components/profiles/profile-form";
import { profilesService } from "@/lib/services/profiles";

export const dynamic = "force-dynamic";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const profile = profilesService.getProfileById(profileId);

  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Edit profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep the candidate context current before running another interview.
        </p>
      </div>
      <ProfileForm
        mode="edit"
        profileId={profileId}
        initialValues={{
          fullName: profile.fullName,
          headline: profile.headline ?? undefined,
          email: profile.email ?? undefined,
          yearsExperience: profile.yearsExperience ?? null,
          targetRoles: profile.targetRoles,
          primaryDomain: profile.primaryDomain ?? undefined,
          notes: profile.notes ?? undefined,
        }}
      />
    </div>
  );
}
