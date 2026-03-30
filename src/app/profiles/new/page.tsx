import { ProfileForm } from "@/components/profiles/profile-form";

export default function NewProfilePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add the candidate details that anchor resume parsing, interview plans, and history.
        </p>
      </div>
      <ProfileForm mode="create" />
    </div>
  );
}
