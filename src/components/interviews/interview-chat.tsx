import { ArrowRight, Flag, Send, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import {
  SessionSummary,
  type SessionSummaryItem,
} from "@/components/interviews/session-summary";
import { TranscriptPanel, type TranscriptTurn } from "@/components/interviews/transcript-panel";

export type InterviewChatProps = {
  title?: string;
  subtitle?: string;
  transcript: TranscriptTurn[];
  summaryItems: SessionSummaryItem[];
  promptValue?: string;
  promptPlaceholder?: string;
  sendLabel?: string;
  endLabel?: string;
  disabled?: boolean;
  sidebarTitle?: string;
  headerMeta?: string;
};

export function InterviewChat({
  title = "Interview chat",
  subtitle = "The transcript and composer are wired by later milestones.",
  transcript,
  summaryItems,
  promptValue,
  promptPlaceholder = "Type your answer...",
  sendLabel = "Send answer",
  endLabel = "End session",
  disabled = false,
  sidebarTitle = "Session summary",
  headerMeta,
}: InterviewChatProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
      <Card className="min-h-[640px]">
        <CardHeader className="space-y-4 border-b border-border/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={disabled}>
                <SquarePen className="size-4" />
                Edit prompt
              </Button>
              <Button variant="secondary" size="sm" disabled={disabled}>
                <Flag className="size-4" />
                {endLabel}
              </Button>
            </div>
          </div>
          {headerMeta ? (
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {headerMeta}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          <TranscriptPanel turns={transcript} />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border/60 p-4 sm:p-6">
          <Textarea
            defaultValue={promptValue}
            placeholder={promptPlaceholder}
            disabled={disabled}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Enter to send, Shift+Enter for a new line.
            </p>
            <Button disabled={disabled}>
              <Send className="size-4" />
              {sendLabel}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <SessionSummary title={sidebarTitle} items={summaryItems} />
        <Card>
          <CardHeader>
            <CardTitle>Prompting notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Use this area later for timer, persona metadata, or interview controls.</p>
            <p>The component intentionally leaves room for future callbacks and state wiring.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
