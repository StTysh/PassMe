import { Briefcase, Mail, MapPin, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ProfileSummary({
  profile,
}: {
  profile: {
    fullName: string;
    headline: string | null;
    email: string | null;
    yearsExperience: number | null;
    targetRoles: string[];
    primaryDomain: string | null;
    notes: string | null;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate">{profile.fullName}</CardTitle>
            {profile.headline ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{profile.headline}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.targetRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.targetRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-3.5" />
            {profile.email ?? "Not set"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="size-3.5" />
            {profile.yearsExperience != null ? `${profile.yearsExperience} yrs exp` : "Not set"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-3.5" />
            {profile.primaryDomain ?? "Not set"}
          </div>
        </div>

        {profile.notes ? (
          <>
            <Separator />
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.notes}</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
