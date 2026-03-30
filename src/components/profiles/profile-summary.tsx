import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CardTitle>{profile.fullName}</CardTitle>
        {profile.headline ? (
          <p className="text-sm text-muted-foreground">{profile.headline}</p>
        ) : null}
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
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <p>Email: {profile.email ?? "Not set"}</p>
          <p>Experience: {profile.yearsExperience != null ? `${profile.yearsExperience} yrs` : "Not set"}</p>
          <p>Domain: {profile.primaryDomain ?? "Not set"}</p>
        </div>
        {profile.notes ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{profile.notes}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
