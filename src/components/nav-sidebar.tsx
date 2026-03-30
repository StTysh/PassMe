import Link from "next/link";
import { BriefcaseBusiness, History, House, Settings2, UserRoundPlus } from "lucide-react";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, typeof House> = {
  home: House,
  profiles: UserRoundPlus,
  interviews: BriefcaseBusiness,
  history: History,
  settings: Settings2,
};

export function NavSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-5 lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BriefcaseBusiness className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground">Interview practice</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const Icon = iconMap[icon] ?? House;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-border bg-secondary/50 p-4">
        <p className="text-xs font-semibold text-foreground">All systems go</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Profiles, interviews, and coaching are ready.
        </p>
      </div>
    </aside>
  );
}
