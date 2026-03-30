import Link from "next/link";
import { ArrowRight, Plus, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { profilesService } from "@/lib/services/profiles";

export const dynamic = "force-dynamic";

export default function ProfilesPage() {
  const profiles = profilesService.listProfiles();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage candidate workspaces.
          </p>
        </div>
        <Button asChild>
          <Link href="/profiles/new">
            <Plus className="mr-1.5 size-4" />
            Create profile
          </Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {profiles.length ? (
          profiles.map((profile) => (
            <Card
              key={profile.id}
              className="transition-all duration-200 hover:border-primary/20 hover:shadow-sm hover:shadow-primary/5"
            >
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{profile.fullName}</h3>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {profile.headline ?? "No headline yet"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {profile.primaryDomain && (
                    <Badge variant="outline" className="hidden sm:inline-flex">
                      {profile.primaryDomain}
                    </Badge>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/profiles/${profile.id}`}>
                      Open
                      <ArrowRight className="ml-1 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No profiles yet. Create one to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
