export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-[2rem] border border-border bg-card p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-28 rounded-full bg-muted" />
        <div className="h-8 w-2/3 rounded-full bg-muted" />
        <div className="h-20 rounded-[1.5rem] bg-muted" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
