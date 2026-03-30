import { ProfileForm } from "@/components/profiles/profile-form";

export default function NewProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add candidate details that anchor resume parsing, interview plans, and history.
        </p>
      </div>
      <ProfileForm mode="create" />
    </div>
  );
}
