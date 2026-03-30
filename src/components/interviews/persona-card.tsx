import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type PersonaCardProps = {
  name: string;
  description: string;
  tone: string;
  warmth: number;
  skepticism: number;
  interruptionFrequency: number;
  followUpIntensity: number;
  challengeStyle: "soft" | "balanced" | "sharp";
  focusAreas: string[];
};

function meterLabel(value: number) {
  return `${Math.round(value)}/100`;
}

export function PersonaCard({
  name,
  description,
  tone,
  warmth,
  skepticism,
  interruptionFrequency,
  followUpIntensity,
  challengeStyle,
  focusAreas,
}: PersonaCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{name}</CardTitle>
          <Badge variant="secondary">{challengeStyle}</Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-border bg-muted/25 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Warmth</span>
              <span>{meterLabel(warmth)}</span>
            </div>
            <Progress value={warmth} />
          </div>
          <div className="space-y-2 rounded-2xl border border-border bg-muted/25 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Skepticism</span>
              <span>{meterLabel(skepticism)}</span>
            </div>
            <Progress value={skepticism} />
          </div>
          <div className="space-y-2 rounded-2xl border border-border bg-muted/25 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Interruptions</span>
              <span>{meterLabel(interruptionFrequency)}</span>
            </div>
            <Progress value={interruptionFrequency} />
          </div>
          <div className="space-y-2 rounded-2xl border border-border bg-muted/25 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Follow-up intensity</span>
              <span>{meterLabel(followUpIntensity)}</span>
            </div>
            <Progress value={followUpIntensity} />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">Tone</p>
          <p className="text-sm text-muted-foreground">{tone}</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">Focus areas</p>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => (
              <Badge key={area} variant="outline">
                {area}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
