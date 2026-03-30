export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-3 w-24 rounded bg-secondary" />
        <div className="h-6 w-2/3 rounded bg-secondary" />
        <div className="h-16 rounded-lg bg-secondary" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
