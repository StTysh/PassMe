import { CreateProfileWizard } from "@/components/profiles/create-profile-wizard";

export default function NewProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop your CV to auto-fill, or enter your details manually.
        </p>
      </div>
      <CreateProfileWizard />
    </div>
  );
}
