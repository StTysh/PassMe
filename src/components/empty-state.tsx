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
    <section className="rounded-[2rem] border border-border/80 bg-card px-6 py-10 text-center shadow-sm sm:px-8">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
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
