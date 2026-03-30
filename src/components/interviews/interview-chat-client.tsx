"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/fetcher";

type Turn = {
  id?: string;
  speaker: "agent" | "candidate" | "system";
  text: string;
  questionCategory?: string | null;
};

export function InterviewChatClient({
  sessionId,
  sessionMeta,
  initialTurns,
}: {
  sessionId: string;
  sessionMeta: {
    personaName: string;
    interviewType: string;
    status: string;
    durationMinutes: number;
  };
  initialTurns: Turn[];
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [started, setStarted] = useState(initialTurns.length > 0);

  const startedAt = useMemo(() => Date.now(), []);
  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);

  useEffect(() => {
    if (started || pending) {
      return;
    }

    void (async () => {
      try {
        setPending(true);
        const result = await fetchJson<{ firstMessage: string }>("/api/interviews/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        setTurns([{ speaker: "agent", text: result.firstMessage, questionCategory: "opening" }]);
        setStarted(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start interview");
      } finally {
        setPending(false);
      }
    })();
  }, [pending, sessionId, started]);

  async function sendTurn() {
    if (!message.trim()) {
      return;
    }

    const candidateTurn = { speaker: "candidate" as const, text: message.trim() };
    setTurns((current) => [...current, candidateTurn]);
    const currentMessage = message.trim();
    setMessage("");

    try {
      setPending(true);
      const result = await fetchJson<{
        agentMessage: string;
        questionCategory: string;
        shouldEnd: boolean;
      }>(`/api/interviews/${sessionId}/next-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateMessage: currentMessage }),
      });

      setTurns((current) => [
        ...current,
        {
          speaker: "agent",
          text: result.agentMessage,
          questionCategory: result.questionCategory,
        },
      ]);

      if (result.shouldEnd) {
        await finishInterview();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send turn");
    } finally {
      setPending(false);
    }
  }

  async function finishInterview() {
    try {
      setPending(true);
      await fetchJson(`/api/interviews/${sessionId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      toast.success("Interview finished");
      router.push(`/interviews/${sessionId}/review`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to finish interview");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{sessionMeta.personaName}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{sessionMeta.interviewType}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{sessionMeta.status}</Badge>
            <Badge variant="outline">{sessionMeta.durationMinutes} min</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[60vh] space-y-3 overflow-y-auto rounded-2xl bg-muted/20 p-4">
            {turns.map((turn, index) => (
              <div
                key={`${turn.speaker}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                  turn.speaker === "candidate"
                    ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                    : "max-w-[85%] bg-card"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                  {turn.speaker}
                </p>
                <p>{turn.text}</p>
              </div>
            ))}
          </div>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type your answer..."
            disabled={pending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendTurn();
              }
            }}
          />
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Enter to send, Shift+Enter for newline.</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={finishInterview} disabled={pending}>
                End session
              </Button>
              <Button onClick={sendTurn} disabled={pending || !message.trim()}>
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Persona: {sessionMeta.personaName}</p>
          <p>Type: {sessionMeta.interviewType}</p>
          <p>Status: {sessionMeta.status}</p>
          <p>Elapsed: about {elapsedSeconds}s</p>
        </CardContent>
      </Card>
    </div>
  );
}
