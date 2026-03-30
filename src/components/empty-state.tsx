import Link from "next/link";

import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <section className="rounded-xl border border-border bg-card px-6 py-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        {eyebrow}
      </p>
      <h2 className="mx-auto mt-3 max-w-xl text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <div className="mt-6">
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
