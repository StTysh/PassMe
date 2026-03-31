"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Sparkles,
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
import type { DocumentType } from "@/lib/types/domain";
import { profileSchema } from "@/lib/validation/profile";

import type { z } from "zod";

type ProfileFormValues = z.input<typeof profileSchema>;

type ResumeExtract = {
  candidateName?: string;
  candidateEmail?: string;
  candidateHeadline?: string;
  totalYearsExperience?: number | null;
  primaryDomain?: string;
  roles?: Array<{ title: string; company: string }>;
};

type UploadedDocument = {
  id: string;
  type: DocumentType;
  title: string;
};

function getDocumentLabel(type: DocumentType) {
  return DOCUMENT_TYPES.find((doc) => doc.value === type)?.label ?? type;
}

const STEPS = [
  { label: "Profile details", icon: User },
  { label: "Job description", icon: Upload },
] as const;

function getSelectedFile(input: HTMLInputElement | null) {
  return input?.files?.[0] ?? null;
}

function validateDocumentSubmission(
  file: File | null,
  text: string,
  type: DocumentType,
  title: string,
) {
  if (!file && !text.trim()) {
    throw new Error("Upload a file or paste document text.");
  }

  if (type === "job_description" && !title.trim()) {
    throw new Error("Enter a job title before uploading the job description.");
  }
}

export function CreateProfileWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [resumeDocId, setResumeDocId] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);

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
        <StepProfileWithCV
          onCreated={(id, docId) => {
            setProfileId(id);
            if (docId) {
              setResumeDocId(docId);
              setUploadedDocs([{ id: docId, type: "resume", title: "Resume" }]);
            }
            setStep(1);
          }}
        />
      )}

      {step === 1 && profileId && (
        <StepJobDescription
          profileId={profileId}
          hasResume={!!resumeDocId}
          uploadedDocs={uploadedDocs}
          onDocUploaded={(doc) =>
            setUploadedDocs((prev) => [...prev, doc])
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

function StepProfileWithCV({
  onCreated,
}: {
  onCreated: (profileId: string, resumeDocId: string | null) => void;
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
  const targetRoles = form.watch("targetRoles");

  const [cvState, setCvState] = useState<"idle" | "uploading" | "parsing" | "done" | "error">("idle");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processCV = useCallback(async (file: File) => {
    setCvState("uploading");
    setCvFileName(file.name);
    setCvFile(file);
    setAutoFilledFields([]);

    try {
      setCvState("parsing");

      const extractForm = new FormData();
      extractForm.set("file", file);

      const result = await fetchJson<{ extracted: ResumeExtract }>(
        "/api/documents/extract-profile",
        { method: "POST", body: extractForm },
      );

      const p = result.extracted;
      const filled: string[] = [];

      if (p.candidateName && !form.getValues("fullName")) {
        form.setValue("fullName", p.candidateName, { shouldValidate: true });
        filled.push("Name");
      }
      if (p.candidateEmail && !form.getValues("email")) {
        form.setValue("email", p.candidateEmail, { shouldValidate: true });
        filled.push("Email");
      }
      if (p.candidateHeadline && !form.getValues("headline")) {
        form.setValue("headline", p.candidateHeadline, { shouldValidate: true });
        filled.push("Headline");
      }
      if (p.totalYearsExperience != null && !form.getValues("yearsExperience")) {
        form.setValue("yearsExperience", p.totalYearsExperience, { shouldValidate: true });
        filled.push("Experience");
      }
      if (p.primaryDomain && !form.getValues("primaryDomain")) {
        form.setValue("primaryDomain", p.primaryDomain, { shouldValidate: true });
        filled.push("Domain");
      }
      if (p.roles?.length) {
        const currentRoles = form.getValues("targetRoles");
        if (!currentRoles || (Array.isArray(currentRoles) && currentRoles.length === 0)) {
          const targetRoles = [...new Set(p.roles.map((r) => r.title))].slice(0, 3);
          form.setValue("targetRoles", targetRoles, { shouldValidate: true });
          filled.push("Target roles");
        }
      }

      setAutoFilledFields(filled);
      setCvState("done");
      if (filled.length > 0) {
        toast.success(`Auto-filled ${filled.length} fields from your CV`);
      } else {
        toast.info("CV analyzed - no new fields to fill");
      }
    } catch (error) {
      setCvState("error");
      toast.error(error instanceof Error ? error.message : "Failed to process CV");
    }
  }, [form]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "application/pdf" || file.name.endsWith(".txt"))) {
        void processCV(file);
      } else {
        toast.error("Please drop a PDF or text file");
      }
    },
    [processCV],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processCV(file);
    },
    [processCV],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (cvState === "uploading" || cvState === "parsing") {
      toast.error("Wait for CV analysis to finish before continuing.");
      return;
    }

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

    const newProfileId = result.profile.id;
    let resumeDocId: string | null = null;

    if (cvFile && cvState === "done") {
      try {
        const formData = new FormData();
        formData.set("candidateProfileId", newProfileId);
        formData.set("type", "resume");
        formData.set("title", cvFileName ?? "Resume");
        formData.set("file", cvFile);

        const uploadResult = await fetchJson<{ documentId: string }>(
          "/api/documents/upload",
          { method: "POST", body: formData },
        );
        resumeDocId = uploadResult.documentId;

        try {
          await fetchJson("/api/documents/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: uploadResult.documentId,
              parseMode: "resume",
            }),
          });
        } catch {
          toast.error("CV uploaded, but resume parsing failed. You can retry from the profile page.");
        }
      } catch {
        toast.error("CV upload failed - you can re-upload from your profile page");
      }
    }

    toast.success("Profile created - now add your job description");
    onCreated(newProfileId, resumeDocId);
  });

  return (
    <div className="space-y-4">
      {/* CV Quick-Fill Drop Zone */}
      <Card
        className={`overflow-hidden transition-all duration-200 ${
          isDragOver ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""
        } ${cvState === "done" ? "border-emerald-500/30" : ""}`}
      >
        <CardContent
          className="p-0"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="relative flex flex-col items-center gap-3 p-6 text-center">
            {cvState === "idle" && (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Drop your CV to auto-fill your profile
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    We&apos;ll extract your name, email, experience, and more - or fill in manually below
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="size-3.5" />
                  Browse files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </>
            )}

            {(cvState === "uploading" || cvState === "parsing") && (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-semibold">
                    {cvState === "uploading" ? "Uploading CV..." : "Analyzing your CV..."}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cvFileName}
                  </p>
                </div>
              </>
            )}

            {cvState === "done" && (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Check className="size-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    CV analyzed successfully
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cvFileName}
                    {autoFilledFields.length > 0 && (
                      <> - filled: {autoFilledFields.join(", ")}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {autoFilledFields.map((field) => (
                    <Badge key={field} variant="success" className="text-[10px]">
                      <Sparkles className="mr-1 size-2.5" />
                      {field}
                    </Badge>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCvState("idle");
                    setCvFileName(null);
                    setCvFile(null);
                    setAutoFilledFields([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-muted-foreground"
                >
                  Upload a different CV
                </Button>
              </>
            )}

            {cvState === "error" && (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                  <FileText className="size-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-400">
                    Failed to process CV
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{cvFileName}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCvState("idle");
                    setCvFileName(null);
                    setCvFile(null);
                    setAutoFilledFields([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Try again
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>
            {cvState === "done"
              ? "Review the auto-filled fields below and adjust anything that needs changing."
              : "Fill in your candidate information, or drop a CV above to auto-fill. Only your full name is required here; the rest is optional."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName" className="flex items-center gap-1.5">
                Full name *
                {autoFilledFields.includes("Name") && (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">auto-filled</Badge>
                )}
              </Label>
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
              <Label htmlFor="headline" className="flex items-center gap-1.5">
                Headline (optional)
                {autoFilledFields.includes("Headline") && (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">auto-filled</Badge>
                )}
              </Label>
              <Input
                id="headline"
                placeholder="Senior Software Engineer"
                {...form.register("headline")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                Email (optional)
                {autoFilledFields.includes("Email") && (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">auto-filled</Badge>
                )}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                {...form.register("email")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience" className="flex items-center gap-1.5">
                Years of experience (optional)
                {autoFilledFields.includes("Experience") && (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">auto-filled</Badge>
                )}
              </Label>
              <Input
                id="yearsExperience"
                type="number"
                placeholder="5"
                {...form.register("yearsExperience", {
                  setValueAs: (value) => {
                    if (value === "" || value === null || value === undefined) {
                      return null;
                    }

                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? null : parsed;
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryDomain" className="flex items-center gap-1.5">
                Primary domain (optional)
                {autoFilledFields.includes("Domain") && (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">auto-filled</Badge>
                )}
              </Label>
              <Input
                id="primaryDomain"
                placeholder="Frontend, Backend, Product..."
                {...form.register("primaryDomain")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="targetRoles" className="flex items-center gap-1.5">
                Target roles (optional)
                {autoFilledFields.includes("Target roles") && (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">auto-filled</Badge>
                )}
              </Label>
              <Input
                id="targetRoles"
                placeholder="Separate with commas (e.g. PM, TPM, Engineering Manager)"
                value={Array.isArray(targetRoles) ? targetRoles.join(", ") : ""}
                key={autoFilledFields.join(",")}
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
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional context about your background..."
                {...form.register("notes")}
              />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button
                type="submit"
                disabled={isSubmitting || cvState === "uploading" || cvState === "parsing"}
              >
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
    </div>
  );
}

function StepJobDescription({
  profileId,
  hasResume,
  uploadedDocs,
  onDocUploaded,
  onFinish,
}: {
  profileId: string;
  hasResume: boolean;
  uploadedDocs: UploadedDocument[];
  onDocUploaded: (doc: UploadedDocument) => void;
  onFinish: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [type, setType] = useState<
    | "resume"
    | "job_description"
    | "cover_letter"
    | "application_answer"
    | "company_context"
  >(hasResume ? "job_description" : "resume");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  async function handleUpload() {
    try {
      setPending(true);
      const file = getSelectedFile(fileRef.current);
      validateDocumentSubmission(file, text, type, title);
      const formData = new FormData();
      formData.set("candidateProfileId", profileId);
      formData.set("type", type);
      formData.set("title", title);
      formData.set("text", text);
      if (file) {
        formData.set("file", file);
      }

      const result = await fetchJson<{ documentId: string }>(
        "/api/documents/upload",
        { method: "POST", body: formData },
      );

      if (type === "resume" || type === "job_description") {
        try {
          await fetchJson("/api/documents/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: result.documentId,
              parseMode: type === "resume" ? "resume" : "job_description",
            }),
          });
          toast.success(`${DOCUMENT_TYPES.find((d) => d.value === type)?.label ?? type} saved and parsed`);
        } catch (error) {
          const docLabel =
            DOCUMENT_TYPES.find((d) => d.value === type)?.label ?? type;
          toast.error(
            error instanceof Error
              ? `${docLabel} saved, but parsing failed: ${error.message}`
              : `${docLabel} saved, but parsing failed`,
          );
        }
      } else {
        const docLabel = getDocumentLabel(type);
        toast.success(`${docLabel} saved`);
      }

      const docLabel = getDocumentLabel(type);
      onDocUploaded({
        id: result.documentId,
        type,
        title: title.trim() || docLabel,
      });

      setTitle("");
      setText("");
      if (fileRef.current) fileRef.current.value = "";

      const willHaveResume =
        hasResume || uploadedDocs.some((doc) => doc.type === "resume") || type === "resume";
      const willHaveJob =
        uploadedDocs.some((doc) => doc.type === "job_description") || type === "job_description";

      if (type === "job_description" && !willHaveResume) {
        setType("resume");
      } else if (type === "resume") {
        setType("job_description");
      } else if (!willHaveResume) {
        setType("resume");
      } else if (!willHaveJob) {
        setType("job_description");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  const hasJob = uploadedDocs.some((doc) => doc.type === "job_description");
  const resumeReady = hasResume || uploadedDocs.some((doc) => doc.type === "resume");
  const documentBodyProvided = Boolean(getSelectedFile(fileRef.current) || text.trim());
  const titleRequired = type === "job_description";
  const canUpload = !pending && documentBodyProvided && (!titleRequired || Boolean(title.trim()));
  const titleLabel =
    type === "job_description" ? "Job title *" : "Document title (optional)";
  const titlePlaceholder =
    type === "job_description"
      ? "e.g. Senior Frontend Engineer"
      : "e.g. Senior Engineer - Google";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            {hasResume ? "Upload job description" : "Upload documents"}
          </CardTitle>
          <CardDescription>
            {hasResume
              ? "Your resume was already uploaded. Now add the job description you're targeting."
              : "Add your resume and the job description you're targeting. Resume and job description content are required to run an interview. A job title is required when uploading a job description."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadedDocs.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Uploaded so far</Label>
              <div className="flex flex-wrap gap-1.5">
                {uploadedDocs.map((doc) => (
                  <Badge key={doc.id} variant="success">
                    <Check className="mr-1 size-3" />
                    {doc.title}
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
              <Label>{titleLabel}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titlePlaceholder}
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
            <Button type="button" onClick={handleUpload} disabled={!canUpload}>
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
          {!resumeReady && !hasJob && (
            <p className="text-muted-foreground">
              Upload at least a <span className="font-medium text-foreground">resume</span> and a{" "}
              <span className="font-medium text-foreground">job description</span> to run an interview.
            </p>
          )}
          {resumeReady && !hasJob && (
            <p className="text-muted-foreground">
              Resume ready. Now add a{" "}
              <span className="font-medium text-foreground">job description</span> to continue.
            </p>
          )}
          {!resumeReady && hasJob && (
            <p className="text-muted-foreground">
              Job description uploaded. Now add a{" "}
              <span className="font-medium text-foreground">resume</span> to continue.
            </p>
          )}
            {resumeReady && hasJob && (
              <p className="font-medium text-emerald-400">
                Documents uploaded. Review them on the profile page before starting an interview.
              </p>
            )}
        </div>
        <Button onClick={onFinish} variant={resumeReady && hasJob ? "glow" : "outline"}>
          {resumeReady && hasJob ? (
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
