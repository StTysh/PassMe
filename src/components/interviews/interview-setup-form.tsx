import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type SetupChoice = {
  label: string;
  value: string;
  description?: string;
};

export type InterviewSetupFormProps = {
  title?: string;
  subtitle?: string;
  profileLabel?: string;
  jobLabel?: string;
  profileOptions: SetupChoice[];
  jobOptions: SetupChoice[];
  typeOptions: SetupChoice[];
  personaOptions: SetupChoice[];
  difficultyOptions: SetupChoice[];
  interestOptions: SetupChoice[];
  durationOptions: SetupChoice[];
  actionLabel?: string;
};

function ChoiceGrid({
  title,
  options,
}: {
  title: string;
  options: SetupChoice[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{option.label}</span>
              <Badge variant="outline">{option.value}</Badge>
            </div>
            {option.description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {option.description}
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InterviewSetupForm({
  title = "Interview setup",
  subtitle = "Select the basic interview configuration before later milestones wire the planner.",
  profileLabel = "Candidate profile",
  jobLabel = "Job description",
  profileOptions,
  jobOptions,
  typeOptions,
  personaOptions,
  difficultyOptions,
  interestOptions,
  durationOptions,
  actionLabel = "Generate interview plan",
}: InterviewSetupFormProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2 border-b border-border/60">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium">{profileLabel}</p>
            <Input placeholder="Select a candidate profile" />
            <div className="grid gap-2">
              {profileOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-left text-sm transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{option.label}</span>
                    <Badge variant="secondary">{option.value}</Badge>
                  </div>
                  {option.description ? (
                    <p className="mt-2 leading-6 text-muted-foreground">
                      {option.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{jobLabel}</p>
            <Textarea placeholder="Select a job description document" />
            <div className="grid gap-2">
              {jobOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-left text-sm transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{option.label}</span>
                    <Badge variant="secondary">{option.value}</Badge>
                  </div>
                  {option.description ? (
                    <p className="mt-2 leading-6 text-muted-foreground">
                      {option.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ChoiceGrid title="Interview type" options={typeOptions} />
        <ChoiceGrid title="Persona" options={personaOptions} />
        <div className="grid gap-6 md:grid-cols-3">
          <ChoiceGrid title="Difficulty" options={difficultyOptions} />
          <ChoiceGrid title="Interest level" options={interestOptions} />
          <ChoiceGrid title="Duration" options={durationOptions} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-border bg-muted/20 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            This component only presents the configuration surface. Later milestones will wire the plan-generation action.
          </p>
          <Button>{actionLabel}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
