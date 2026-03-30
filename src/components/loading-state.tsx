export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="shimmer h-3 w-24 rounded" />
        <div className="shimmer h-6 w-2/3 rounded" />
        <div className="shimmer h-20 rounded-lg" />
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
        {label}
      </p>
    </div>
  );
}
