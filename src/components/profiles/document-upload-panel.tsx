"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { fetchJson } from "@/lib/fetcher";
import type { CVValidationResult } from "@/lib/types/domain";

export function DocumentUploadPanel({ profileId }: { profileId: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [type, setType] = useState<"resume" | "job_description" | "cover_letter" | "application_answer" | "company_context">("resume");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [validation, setValidation] = useState<CVValidationResult | null>(null);

  async function handleSubmit() {
    try {
      setPending(true);
      setValidation(null);
      const formData = new FormData();
      formData.set("candidateProfileId", profileId);
      formData.set("type", type);
      formData.set("title", title);
      formData.set("text", text);
      const file = fileRef.current?.files?.[0];
      if (file) {
        formData.set("file", file);
      }

      const result = await fetchJson<{ documentId: string }>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (type === "resume" || type === "job_description") {
        const parseResult = await fetchJson<{ parsed: Record<string, unknown> & { _validation?: CVValidationResult } }>("/api/documents/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: result.documentId,
            parseMode: type === "resume" ? "resume" : "job_description",
          }),
        });

        if (type === "resume" && parseResult.parsed?._validation) {
          setValidation(parseResult.parsed._validation);
        }
      }

      toast.success("Document saved and parsed");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="size-4 text-primary" />
          Add document
        </CardTitle>
        <CardDescription>
          Upload a PDF or paste text content directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              {DOCUMENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. My Resume 2026" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>PDF or text file</Label>
          <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center transition-colors hover:border-primary/30">
            <FileText className="mx-auto size-8 text-muted-foreground/40" />
            <Input ref={fileRef} type="file" accept=".pdf,.txt" className="mt-2" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Or paste text directly</Label>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste document content here..."
            className="min-h-[100px]"
          />
        </div>

        {validation && (
          <CVValidationDisplay validation={validation} />
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="mr-1.5 size-4" />
                Save document
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CVValidationDisplay({ validation }: { validation: CVValidationResult }) {
  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning");
  const infos = validation.issues.filter((i) => i.severity === "info");

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <>
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">CV looks good</span>
          </>
        ) : (
          <>
            <AlertTriangle className="size-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">CV needs attention</span>
          </>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((issue, i) => (
            <div key={`e-${i}`} className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-400" />
              <div>
                <span className="text-xs font-medium text-red-400">{issue.field}</span>
                <p className="text-xs text-muted-foreground">{issue.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((issue, i) => (
            <div key={`w-${i}`} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              <div>
                <span className="text-xs font-medium text-amber-400">{issue.field}</span>
                <p className="text-xs text-muted-foreground">{issue.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {infos.length > 0 && (
        <div className="space-y-1.5">
          {infos.map((issue, i) => (
            <div key={`i-${i}`} className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-blue-400" />
              <div>
                <span className="text-xs font-medium text-blue-400">{issue.field}</span>
                <p className="text-xs text-muted-foreground">{issue.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggestions</p>
          <ul className="mt-1 space-y-1">
            {validation.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
