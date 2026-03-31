"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Users,
  Search,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Brain,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CompanyConfirmation } from "@/components/interviews/company-confirmation";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPES,
  SESSION_DURATIONS,
} from "@/lib/constants";
import { fetchJson } from "@/lib/fetcher";
import type {
  CompanyCandidate,
  CompanyResolutionResult,
} from "@/lib/types/domain";

const PANEL_SIZES = [
  { value: 1, label: "1 interviewer", description: "One-on-one interview" },
  { value: 2, label: "2 interviewers", description: "Small panel interview" },
  { value: 3, label: "3 interviewers", description: "Full panel interview" },
] as const;

type FlowStep = "setup" | "resolving" | "confirm" | "preparing" | "ready";

const PREPARATION_STAGES = [
  { icon: Search, label: "Researching company in depth...", key: "research" },
  { icon: Brain, label: "Analyzing role & candidate fit...", key: "analyze" },
  { icon: Users, label: "Building interviewer panel...", key: "panel" },
  { icon: BookOpen, label: "Planning interview questions...", key: "plan" },
  { icon: Sparkles, label: "Finalizing interview brief...", key: "finalize" },
];

export function PlannerFormClient({
  profiles,
  jobs,
  defaultProfileId,
}: {
  profiles: Array<{ id: string; fullName: string }>;
  jobs: Array<{ id: string; title: string; candidateProfileId: string }>;
  personas?: Array<{ key: string; name: string; description: string }>;
  defaultProfileId?: string;
}) {
  const router = useRouter();
  const initialProfile =
    (defaultProfileId &&
      profiles.find((p) => p.id === defaultProfileId)?.id) ||
    profiles[0]?.id ||
    "";

  const [profileId, setProfileId] = useState(initialProfile);
  const [jobId, setJobId] = useState(
    jobs.find((job) => job.candidateProfileId === initialProfile)?.id ??
      "",
  );
  const [companyName, setCompanyName] = useState("");
  const [panelSize, setPanelSize] = useState<1 | 2 | 3>(2);
  const [interviewType, setInterviewType] = useState(
    INTERVIEW_TYPES[1]?.value ?? "hiring_manager",
  );
  const [difficulty, setDifficulty] = useState<"easy" | "realistic" | "hard">(
    "realistic",
  );
  const [durationMinutes, setDurationMinutes] = useState(10);

  const [step, setStep] = useState<FlowStep>("setup");
  const [resolution, setResolution] =
    useState<CompanyResolutionResult | null>(null);
  const [confirmedCompany, setConfirmedCompany] =
    useState<CompanyCandidate | null>(null);
  const [prepStageIndex, setPrepStageIndex] = useState(0);
  const [resolveQuery, setResolveQuery] = useState("");

  const filteredJobs = jobs.filter(
    (job) => job.candidateProfileId === profileId,
  );

  const handleConfirmedRef = useRef<(company: CompanyCandidate) => void>(() => {});
  handleConfirmedRef.current = (company: CompanyCandidate) => {
    setConfirmedCompany(company);
    setCompanyName(company.name);
    startPreparing(company);
  };

  const resolveCompany = useCallback(
    async (query: string) => {
      setStep("resolving");
      setResolveQuery(query);
      try {
        const selectedJob = jobs.find((j) => j.id === jobId);
        const result = await fetchJson<{
          resolution: CompanyResolutionResult;
        }>("/api/company/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: query,
            candidateProfileId: profileId,
            jobTitle: selectedJob?.title,
            jobDocumentId: jobId,
          }),
        });

        setResolution(result.resolution);

        if (
          !result.resolution.needsConfirmation &&
          result.resolution.topMatch.confidence === "high"
        ) {
          handleConfirmedRef.current(result.resolution.topMatch);
        } else {
          setStep("confirm");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to identify company",
        );
        setStep("setup");
      }
    },
    [jobId, jobs, profileId],
  );

  function handleCompanyConfirmed(company: CompanyCandidate) {
    handleConfirmedRef.current(company);
  }

  async function startPreparing(company: CompanyCandidate) {
    setStep("preparing");
    setPrepStageIndex(0);

    const stageInterval = setInterval(() => {
      setPrepStageIndex((prev) => {
        if (prev >= PREPARATION_STAGES.length - 1) {
          clearInterval(stageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    try {
      const result = await fetchJson<{ sessionId: string }>(
        "/api/interviews/plan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateProfileId: profileId,
            jobDocumentId: jobId,
            companyName: company.name,
            panelSize,
            interviewType,
            difficulty,
            durationMinutes,
          }),
        },
      );

      clearInterval(stageInterval);
      setPrepStageIndex(PREPARATION_STAGES.length - 1);
      setStep("ready");

      await new Promise((r) => setTimeout(r, 800));
      toast.success("Interview panel created — starting session...");
      router.push(`/interviews/${result.sessionId}`);
      router.refresh();
    } catch (error) {
      clearInterval(stageInterval);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate plan",
      );
      setStep("confirm");
    }
  }

  if (step === "resolving") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Search className="size-7 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="mt-6 text-lg font-semibold">
            Identifying company...
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Resolving &ldquo;{resolveQuery}&rdquo; to find the right company
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === "confirm" && resolution) {
    return (
      <Card>
        <CardContent className="pt-6">
          <CompanyConfirmation
            resolution={resolution}
            originalQuery={resolveQuery}
            onConfirm={handleCompanyConfirmed}
            onReject={() => {
              setStep("setup");
              setResolution(null);
              setConfirmedCompany(null);
            }}
            onSearchAgain={(query) => {
              setResolution(null);
              resolveCompany(query);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (step === "preparing" || step === "ready") {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="mx-auto max-w-md space-y-8">
            <div className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
                {step === "ready" ? (
                  <CheckCircle2 className="size-7 text-emerald-400" />
                ) : (
                  <Loader2 className="size-7 text-primary animate-spin" />
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {step === "ready"
                  ? "Interview ready!"
                  : "Preparing your interview"}
              </h3>
              {confirmedCompany && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Deep research on {confirmedCompany.name} for a tailored
                  experience
                </p>
              )}
            </div>

            <div className="space-y-1">
              {PREPARATION_STAGES.map((stage, i) => {
                const isActive = i === prepStageIndex && step !== "ready";
                const isComplete = i < prepStageIndex || step === "ready";
                const isPending = i > prepStageIndex && step !== "ready";
                const Icon = stage.icon;

                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-500 ${
                      isActive
                        ? "bg-primary/5 text-foreground"
                        : isComplete
                          ? "text-muted-foreground"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center">
                      {isActive ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : isComplete ? (
                        <CheckCircle2 className="size-4 text-emerald-400" />
                      ) : (
                        <Icon
                          className={`size-4 ${isPending ? "opacity-40" : ""}`}
                        />
                      )}
                    </div>
                    <span className="text-sm">{stage.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-full bg-secondary">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000 ease-out"
                style={{
                  width: `${step === "ready" ? 100 : Math.max(10, ((prepStageIndex + 1) / PREPARATION_STAGES.length) * 90)}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up your interview</CardTitle>
        <CardDescription>
          Configure your interview settings. We&apos;ll identify and research
          the target company before building a tailored interview experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="flex items-center gap-1.5">
            <Building2 className="size-3.5" />
            Company name
          </Label>
          <div className="flex gap-2">
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Stripe, Airbnb, your target company..."
              className="flex-1 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && companyName.trim()) {
                  resolveCompany(companyName.trim());
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We&apos;ll verify the company identity and conduct deep research
            before building your interview.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Candidate profile</Label>
          <Select
            value={profileId}
            onChange={(event) => {
              setProfileId(event.target.value);
              const nextJob =
                jobs.find(
                  (job) => job.candidateProfileId === event.target.value,
                )?.id ?? "";
              setJobId(nextJob);
            }}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.fullName}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Job description</Label>
          <Select
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
          >
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))
            ) : (
              <option value="">No jobs for this profile</option>
            )}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Interview type</Label>
          <Select
            value={interviewType}
            onChange={(event) =>
              setInterviewType(
                event.target.value as typeof interviewType,
              )
            }
          >
            {INTERVIEW_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            Interview panel
          </Label>
          <Select
            value={String(panelSize)}
            onChange={(event) =>
              setPanelSize(Number(event.target.value) as 1 | 2 | 3)
            }
          >
            {PANEL_SIZES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.description}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as typeof difficulty)
            }
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select
            value={String(durationMinutes)}
            onChange={(event) =>
              setDurationMinutes(Number(event.target.value))
            }
          >
            {SESSION_DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration} minutes
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end justify-end sm:col-span-2">
          <Button
            onClick={() => resolveCompany(companyName.trim())}
            disabled={!profileId || !jobId || !companyName.trim()}
            variant="glow"
          >
            <ArrowRight className="mr-1.5 size-4" />
            Identify company &amp; continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
