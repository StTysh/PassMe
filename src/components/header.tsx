"use client";

import Link from "next/link";
import { ArrowUpRight, BotMessageSquare, Menu, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavSidebar } from "@/components/nav-sidebar";

export function Header({ geminiReady }: { geminiReady?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-card/30 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation menu</SheetTitle>
              <SheetDescription>
                Browse pages and app sections from the mobile navigation drawer.
              </SheetDescription>
            </SheetHeader>
            <NavSidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Interview Loop
          </h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Sharp, local-first interview simulation
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className={`size-3.5 ${geminiReady ? "text-emerald-400" : "text-amber-400"}`} />
          <span className="hidden sm:inline">{geminiReady ? "Gemini ready" : "Gemini not configured"}</span>
          <span className="sm:hidden">{geminiReady ? "Ready" : "No API"}</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/settings">
            <span className="hidden sm:inline">Settings</span>
            <ArrowUpRight className="size-3.5 sm:ml-1" />
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/interviews/new">
            <BotMessageSquare className="mr-1 size-3.5" />
            <span className="hidden sm:inline">Start interview</span>
            <span className="sm:hidden">Start</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
