"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  DIFFICULTY_OPTIONS,
  INTEREST_LEVEL_OPTIONS,
  INTERVIEW_TYPES,
  SESSION_DURATIONS,
} from "@/lib/constants";
import { fetchJson } from "@/lib/fetcher";

export function PlannerFormClient({
  profiles,
  jobs,
  personas,
  defaultProfileId,
}: {
  profiles: Array<{ id: string; fullName: string }>;
  jobs: Array<{ id: string; title: string; candidateProfileId: string }>;
  personas: Array<{ key: string; name: string; description: string }>;
  defaultProfileId?: string;
}) {
  const router = useRouter();
  const initialProfile =
    (defaultProfileId && profiles.find((p) => p.id === defaultProfileId)?.id) ||
    profiles[0]?.id ||
    "";
  const [profileId, setProfileId] = useState(initialProfile);
  const [jobId, setJobId] = useState(
    jobs.find((job) => job.candidateProfileId === initialProfile)?.id ?? jobs[0]?.id ?? "",
  );
  const [personaKey, setPersonaKey] = useState(personas[1]?.key ?? personas[0]?.key ?? "");
  const [interviewType, setInterviewType] = useState(INTERVIEW_TYPES[1]?.value ?? "hiring_manager");
  const [difficulty, setDifficulty] = useState<"easy" | "realistic" | "hard">("realistic");
  const [interestLevel, setInterestLevel] = useState<"low" | "medium" | "high">("medium");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [pending, setPending] = useState(false);

  const filteredJobs = jobs.filter((job) => job.candidateProfileId === profileId);

  async function handleGenerate() {
    try {
      setPending(true);
      const result = await fetchJson<{ sessionId: string }>("/api/interviews/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateProfileId: profileId,
          jobDocumentId: jobId,
          personaKey,
          interviewType,
          difficulty,
          interestLevel,
          durationMinutes,
        }),
      });

      toast.success("Interview plan generated — starting session...");
      router.push(`/interviews/${result.sessionId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate plan");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate interview plan</CardTitle>
        <CardDescription>
          Choose your candidate profile, target role, and interview parameters.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Candidate profile</Label>
          <Select
            value={profileId}
            onChange={(event) => {
              setProfileId(event.target.value);
              const nextJob = jobs.find((job) => job.candidateProfileId === event.target.value)?.id ?? "";
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
          <Select value={jobId} onChange={(event) => setJobId(event.target.value)}>
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
          <Select value={interviewType} onChange={(event) => setInterviewType(event.target.value as typeof interviewType)}>
            {INTERVIEW_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Persona</Label>
          <Select value={personaKey} onChange={(event) => setPersonaKey(event.target.value)}>
            {personas.map((persona) => (
              <option key={persona.key} value={persona.key}>
                {persona.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Interest level</Label>
          <Select
            value={interestLevel}
            onChange={(event) => setInterestLevel(event.target.value as typeof interestLevel)}
          >
            {INTEREST_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={String(durationMinutes)} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
            {SESSION_DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration} minutes
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end justify-end sm:col-span-2">
          <Button onClick={handleGenerate} disabled={pending || !profileId || !jobId} variant="glow">
            {pending ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="mr-1.5 size-4" />
                Generate interview plan
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
