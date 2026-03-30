import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profilesService } from "@/lib/services/profiles";

export const dynamic = "force-dynamic";

export default function ProfilesPage() {
  const profiles = profilesService.listProfiles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Profiles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage candidate workspaces.
          </p>
        </div>
        <Button asChild>
          <Link href="/profiles/new">Create profile</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {profiles.length ? (
          profiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader>
                <CardTitle>{profile.fullName}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {profile.headline ?? "No headline yet"}
                </p>
                <Button asChild variant="secondary">
                  <Link href={`/profiles/${profile.id}`}>Open workspace</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No profiles yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
