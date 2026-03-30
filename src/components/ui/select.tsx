import { cn } from "@/lib/utils";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full appearance-none rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none ring-offset-background transition-all duration-200 hover:border-muted-foreground/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0 [&>option]:bg-card [&>option]:text-foreground",
        props.className,
      )}
    />
  );
}
