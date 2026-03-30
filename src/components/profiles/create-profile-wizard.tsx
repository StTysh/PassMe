"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Upload,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { fetchJson } from "@/lib/fetcher";
import { profileSchema } from "@/lib/validation/profile";

import type { z } from "zod";

type ProfileFormValues = z.input<typeof profileSchema>;

const STEPS = [
  { label: "Profile details", icon: User },
  { label: "Upload documents", icon: Upload },
] as const;

export function CreateProfileWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 sm:w-12 ${done ? "bg-primary" : "bg-border"}`}
                />
              )}
              <button
                type="button"
                disabled={i > step}
                onClick={() => {
                  if (i < step) setStep(i);
                }}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : done
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : (
                  <s.icon className="size-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">Step {i + 1}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {step === 0 && (
        <StepProfileDetails
          onCreated={(id) => {
            setProfileId(id);
            setStep(1);
          }}
        />
      )}

      {step === 1 && profileId && (
        <StepDocuments
          profileId={profileId}
          uploadedDocs={uploadedDocs}
          onDocUploaded={(label) =>
            setUploadedDocs((prev) => [...prev, label])
          }
          onFinish={() => {
            router.push(`/profiles/${profileId}`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StepProfileDetails({
  onCreated,
}: {
  onCreated: (profileId: string) => void;
}) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      fullName: "",
      headline: "",
      email: "",
      yearsExperience: null,
      targetRoles: [],
      primaryDomain: "",
      notes: "",
    },
  });

  const { isSubmitting, errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      ...values,
      targetRoles: Array.isArray(values.targetRoles)
        ? values.targetRoles
        : String(values.targetRoles)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
    };

    const result = await fetchJson<{ profile: { id: string } }>(
      "/api/profiles",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    toast.success("Profile created — now attach your documents");
    onCreated(result.profile.id);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>
          Fill in your candidate information. You&apos;ll add your resume and job
          description in the next step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Full name *</Label>
            <Input
              id="fullName"
              placeholder="Jane Doe"
              {...form.register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-red-400">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="Senior Software Engineer"
              {...form.register("headline")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              {...form.register("email")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input
              id="yearsExperience"
              type="number"
              placeholder="5"
              {...form.register("yearsExperience")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryDomain">Primary domain</Label>
            <Input
              id="primaryDomain"
              placeholder="Frontend, Backend, Product..."
              {...form.register("primaryDomain")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="targetRoles">Target roles</Label>
            <Input
              id="targetRoles"
              placeholder="Separate with commas (e.g. PM, TPM, Engineering Manager)"
              onChange={(event) =>
                form.setValue(
                  "targetRoles",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context about your background..."
              {...form.register("notes")}
            />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StepDocuments({
  profileId,
  uploadedDocs,
  onDocUploaded,
  onFinish,
}: {
  profileId: string;
  uploadedDocs: string[];
  onDocUploaded: (label: string) => void;
  onFinish: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [type, setType] = useState<
    | "resume"
    | "job_description"
    | "cover_letter"
    | "application_answer"
    | "company_context"
  >("resume");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  async function handleUpload() {
    try {
      setPending(true);
      const formData = new FormData();
      formData.set("candidateProfileId", profileId);
      formData.set("type", type);
      formData.set("title", title);
      formData.set("text", text);
      const file = fileRef.current?.files?.[0];
      if (file) {
        formData.set("file", file);
      }

      const result = await fetchJson<{ documentId: string }>(
        "/api/documents/upload",
        { method: "POST", body: formData },
      );

      if (type === "resume" || type === "job_description") {
        await fetchJson("/api/documents/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: result.documentId,
            parseMode: type === "resume" ? "resume" : "job_description",
          }),
        });
      }

      const docLabel =
        DOCUMENT_TYPES.find((d) => d.value === type)?.label ?? type;
      onDocUploaded(title || docLabel);
      toast.success(`${docLabel} saved and parsed`);

      setTitle("");
      setText("");
      if (fileRef.current) fileRef.current.value = "";

      const nextType =
        type === "resume" ? "job_description" : type === "job_description" ? "resume" : type;
      setType(
        uploadedDocs.length === 0 && type === "resume"
          ? "job_description"
          : nextType,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  const hasResume = uploadedDocs.some(
    (d) => d.toLowerCase().includes("resume") || d.toLowerCase().includes("cv"),
  );
  const hasJob = uploadedDocs.some(
    (d) =>
      d.toLowerCase().includes("job") || d.toLowerCase().includes("description"),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            Upload documents
          </CardTitle>
          <CardDescription>
            Add your resume and the job description you&apos;re targeting. You can add
            more documents later from your profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadedDocs.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Uploaded so far</Label>
              <div className="flex flex-wrap gap-1.5">
                {uploadedDocs.map((doc, i) => (
                  <Badge key={i} variant="success">
                    <Check className="mr-1 size-3" />
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Document type</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
              >
                {DOCUMENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Resume 2026"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>PDF or text file</Label>
            <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center transition-colors hover:border-primary/30">
              <FileText className="mx-auto size-8 text-muted-foreground/40" />
              <Input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                className="mt-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Or paste text directly</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste document content here..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleUpload} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 size-4" />
                  Upload document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4">
        <div className="text-sm">
          {!hasResume && !hasJob && (
            <p className="text-muted-foreground">
              Upload at least a <span className="font-medium text-foreground">resume</span> and a{" "}
              <span className="font-medium text-foreground">job description</span> to run an interview.
            </p>
          )}
          {hasResume && !hasJob && (
            <p className="text-muted-foreground">
              Resume uploaded. Now add a{" "}
              <span className="font-medium text-foreground">job description</span> to continue.
            </p>
          )}
          {!hasResume && hasJob && (
            <p className="text-muted-foreground">
              Job description uploaded. Now add a{" "}
              <span className="font-medium text-foreground">resume</span> to continue.
            </p>
          )}
          {hasResume && hasJob && (
            <p className="text-emerald-400 font-medium">
              You&apos;re all set — ready to start practicing interviews.
            </p>
          )}
        </div>
        <Button onClick={onFinish} variant={hasResume && hasJob ? "glow" : "outline"}>
          {hasResume && hasJob ? (
            <>
              Go to profile
              <ArrowRight className="ml-1.5 size-4" />
            </>
          ) : (
            "Skip for now"
          )}
        </Button>
      </div>
    </div>
  );
}
