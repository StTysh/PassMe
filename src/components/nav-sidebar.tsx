import Link from "next/link";
import { BriefcaseBusiness, History, House, Settings2, UserRoundPlus } from "lucide-react";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NavSidebar() {
  return (
    <aside className="mb-4 flex w-full flex-col rounded-[2rem] border border-border/70 bg-card/70 p-4 shadow-sm lg:mb-0 lg:mr-4 lg:w-72 lg:p-5">
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
          <BriefcaseBusiness className="size-5" />
        </div>
        <div>
          <p className="text-lg font-semibold">{APP_NAME}</p>
          <p className="text-sm text-muted-foreground">Local-first interview practice</p>
        </div>
      </div>

      <nav className="grid gap-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const Icon =
            {
              home: House,
              profiles: UserRoundPlus,
              interviews: BriefcaseBusiness,
              history: History,
              settings: Settings2,
            }[icon];

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[1.5rem] border border-border bg-muted/35 p-4">
        <p className="text-sm font-semibold">Milestone 1 complete</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The app shell is live. Profiles, documents, and interviews come next in
          milestone order.
        </p>
      </div>
    </aside>
  );
}
