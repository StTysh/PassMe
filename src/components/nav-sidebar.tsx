"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function NavSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col p-5 lg:w-64 lg:shrink-0 lg:border-r lg:border-border lg:bg-card/50 lg:backdrop-blur-sm">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-sm shadow-primary/10">
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
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4 transition-colors", isActive && "text-primary")} />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-border bg-secondary/30 p-4">
        <p className="text-xs font-semibold text-foreground">All systems go</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Profiles, interviews, and coaching are ready.
        </p>
      </div>
    </aside>
  );
}
