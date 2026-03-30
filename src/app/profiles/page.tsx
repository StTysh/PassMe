import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
          <h1 className="text-2xl font-bold tracking-tight">Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage candidate workspaces.
          </p>
        </div>
        <Button asChild>
          <Link href="/profiles/new">Create profile</Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {profiles.length ? (
          profiles.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <h3 className="font-semibold">{profile.fullName}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {profile.headline ?? "No headline yet"}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/profiles/${profile.id}`}>
                    Open
                    <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No profiles yet. Create one to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
