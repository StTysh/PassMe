"use client";

import {
  Building2,
  CheckCircle2,
  Globe,
  MapPin,
  Users,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CompanyCandidate, CompanyResolutionResult } from "@/lib/types/domain";

interface CompanyConfirmationProps {
  resolution: CompanyResolutionResult;
  originalQuery: string;
  onConfirm: (company: CompanyCandidate) => void;
  onReject: () => void;
  onSearchAgain: (query: string) => void;
}

function ConfidenceIndicator({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const config = {
    high: { icon: ShieldCheck, label: "High confidence", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    medium: { icon: ShieldAlert, label: "Medium confidence", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    low: { icon: ShieldQuestion, label: "Low confidence", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  }[confidence];

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="size-3.5" />
      {config.label}
    </div>
  );
}

function CompanyCard({
  company,
  isPrimary,
  onSelect,
}: {
  company: CompanyCandidate;
  isPrimary: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-xl border p-5 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 ${
        isPrimary
          ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/5"
          : "border-border bg-card/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex size-10 items-center justify-center rounded-lg ${isPrimary ? "bg-primary/15" : "bg-muted"}`}>
              <Building2 className={`size-5 ${isPrimary ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <h3 className="font-semibold">{company.name}</h3>
              <p className="text-xs text-muted-foreground">{company.industry}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/80">{company.description}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {company.headquarters !== "Unknown" && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {company.headquarters}
              </span>
            )}
            {company.companySize !== "Unknown" && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" />
                {company.companySize}
              </span>
            )}
            {company.website !== "Unknown" && (
              <span className="inline-flex items-center gap-1">
                <Globe className="size-3" />
                {company.website}
              </span>
            )}
          </div>

          {company.disambiguationNote && (
            <p className="text-xs italic text-muted-foreground/70">{company.disambiguationNote}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <ConfidenceIndicator confidence={company.confidence} />
          {isPrimary && (
            <Badge variant="glow" className="text-[10px]">Best match</Badge>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Select this company &rarr;
        </span>
      </div>
    </button>
  );
}

export function CompanyConfirmation({
  resolution,
  originalQuery,
  onConfirm,
  onReject,
  onSearchAgain,
}: CompanyConfirmationProps) {
  const [showAlternatives, setShowAlternatives] = useState(
    resolution.isAmbiguous || resolution.topMatch.confidence === "low",
  );
  const [searchInput, setSearchInput] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  const hasAlternatives = resolution.alternatives.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Company identification</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {resolution.isAmbiguous
            ? `We found multiple companies matching "${originalQuery}". Please confirm which one you mean.`
            : resolution.topMatch.confidence === "high"
              ? `We identified "${resolution.topMatch.name}" from your search. Please confirm this is correct before we begin deep research.`
              : `We found a possible match for "${originalQuery}", but we're not fully certain. Please verify.`}
        </p>
      </div>

      {resolution.topMatch.confidence !== "high" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div className="text-sm text-amber-200/80">
            {resolution.topMatch.confidence === "low"
              ? "We couldn't confidently identify this company. The match below is our best guess — please verify carefully or try a more specific search."
              : "This match looks likely but isn't certain. Please verify the details below before proceeding."}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {hasAlternatives ? "Top match" : "Identified company"}
        </p>
        <CompanyCard
          company={resolution.topMatch}
          isPrimary
          onSelect={() => onConfirm(resolution.topMatch)}
        />
      </div>

      {hasAlternatives && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {showAlternatives ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {resolution.alternatives.length} other possible {resolution.alternatives.length === 1 ? "match" : "matches"}
          </button>

          {showAlternatives && (
            <div className="space-y-2">
              {resolution.alternatives.map((alt, i) => (
                <CompanyCard
                  key={`${alt.name}-${i}`}
                  company={alt}
                  isPrimary={false}
                  onSelect={() => onConfirm(alt)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReject}>
            <ArrowLeft className="mr-1.5 size-3.5" />
            Go back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearchInput(!showSearchInput)}
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Search again
          </Button>
        </div>

        <Button
          variant="glow"
          size="sm"
          onClick={() => onConfirm(resolution.topMatch)}
        >
          <CheckCircle2 className="mr-1.5 size-3.5" />
          Yes, this is the company
        </Button>
      </div>

      {showSearchInput && (
        <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Try a more specific company name..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchInput.trim()) {
                onSearchAgain(searchInput.trim());
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!searchInput.trim()}
            onClick={() => {
              if (searchInput.trim()) {
                onSearchAgain(searchInput.trim());
              }
            }}
          >
            Search
          </Button>
        </div>
      )}
    </div>
  );
}
