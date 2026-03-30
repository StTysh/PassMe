"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/fetcher";
import { profileSchema } from "@/lib/validation/profile";

import type { z } from "zod";

type ProfileFormValues = z.input<typeof profileSchema>;

export function ProfileForm({
  mode,
  profileId,
  initialValues,
}: {
  mode: "create" | "edit";
  profileId?: string;
  initialValues?: Partial<ProfileFormValues>;
}) {
  const router = useRouter();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      fullName: initialValues?.fullName ?? "",
      headline: initialValues?.headline ?? "",
      email: initialValues?.email ?? "",
      yearsExperience: initialValues?.yearsExperience ?? null,
      targetRoles: initialValues?.targetRoles ?? [],
      primaryDomain: initialValues?.primaryDomain ?? "",
      notes: initialValues?.notes ?? "",
    },
  });

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
      mode === "create" ? "/api/profiles" : `/api/profiles/${profileId}`,
      {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    toast.success(mode === "create" ? "Profile created" : "Profile updated");
    router.push(`/profiles/${result.profile.id}`);
    router.refresh();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Profile details" : "Update details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...form.register("fullName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" {...form.register("headline")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input id="yearsExperience" type="number" {...form.register("yearsExperience")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryDomain">Primary domain</Label>
            <Input id="primaryDomain" {...form.register("primaryDomain")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="targetRoles">Target roles</Label>
            <Input
              id="targetRoles"
              placeholder="Separate with commas"
              defaultValue={initialValues?.targetRoles?.join(", ") ?? ""}
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {mode === "create" ? "Save profile" : "Update profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
