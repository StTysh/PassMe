"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { fetchJson } from "@/lib/fetcher";

export function DocumentUploadPanel({ profileId }: { profileId: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [type, setType] = useState<"resume" | "job_description" | "cover_letter" | "application_answer" | "company_context">("resume");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
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

      const result = await fetchJson<{ documentId: string }>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

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
