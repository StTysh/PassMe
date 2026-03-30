"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, MicOff, Send, Square, Volume2, Headphones } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchJson } from "@/lib/fetcher";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";

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
  voiceEnabled = false,
}: {
  sessionId: string;
  sessionMeta: {
    personaName: string;
    interviewType: string;
    status: string;
    durationMinutes: number;
  };
  initialTurns: Turn[];
  voiceEnabled?: boolean;
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [started, setStarted] = useState(initialTurns.length > 0);
  const [voiceMode, setVoiceMode] = useState(voiceEnabled);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const voiceModeRef = useRef(voiceMode);
  voiceModeRef.current = voiceMode;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const synthesis = useSpeechSynthesis({
    onEnd() {
      if (voiceModeRef.current && !pendingRef.current) {
        recognition.start();
      }
    },
  });

  const recognition = useSpeechRecognition({
    onTranscript(text) {
      if (voiceModeRef.current) setMessage(text);
    },
    onSilenceTimeout(finalText) {
      if (voiceModeRef.current && finalText.trim().length > 3) {
        recognition.stop();
        void sendTurnWithText(finalText.trim());
      }
    },
    silenceMs: 2000,
  });

  const voiceSupported = recognition.isSupported && synthesis.isSupported;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (started || pending) return;

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

        if (voiceModeRef.current && synthesis.isSupported) {
          synthesis.speak(result.firstMessage);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start interview");
      } finally {
        setPending(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, sessionId, started]);

  async function sendTurnWithText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pendingRef.current) return;

    recognition.stop();
    const candidateTurn: Turn = { speaker: "candidate", text: trimmed };
    setTurns((prev) => [...prev, candidateTurn]);
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
        body: JSON.stringify({ candidateMessage: trimmed }),
      });

      setTurns((prev) => [
        ...prev,
        { speaker: "agent", text: result.agentMessage, questionCategory: result.questionCategory },
      ]);

      if (voiceModeRef.current && synthesis.isSupported) {
        synthesis.speak(result.agentMessage);
      }

      if (result.shouldEnd) {
        synthesis.cancel();
        recognition.stop();
        await finishInterview();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send turn");
      if (voiceModeRef.current) recognition.start();
    } finally {
      setPending(false);
    }
  }

  function sendTurn() {
    void sendTurnWithText(message);
  }

  async function finishInterview() {
    try {
      setPending(true);
      synthesis.cancel();
      recognition.stop();
      await fetchJson(`/api/interviews/${sessionId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      toast.success("Interview finished — generating review...");
      router.push(`/interviews/${sessionId}/review`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to finish interview");
    } finally {
      setPending(false);
    }
  }

  function toggleVoice() {
    const next = !voiceMode;
    setVoiceMode(next);
    if (!next) {
      recognition.stop();
      synthesis.cancel();
    } else if (!pending && !synthesis.isSpeaking) {
      recognition.start();
    }
  }

  function toggleMic() {
    if (recognition.isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="min-w-0">
            <CardTitle className="truncate">{sessionMeta.personaName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{sessionMeta.interviewType}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {voiceEnabled && voiceSupported && (
              <Button
                variant={voiceMode ? "default" : "ghost"}
                size="sm"
                onClick={toggleVoice}
                className="gap-1.5"
              >
                {voiceMode ? <Volume2 className="size-3.5" /> : <MicOff className="size-3.5" />}
                <span className="hidden sm:inline">{voiceMode ? "Voice on" : "Voice off"}</span>
              </Button>
            )}
            <Badge variant="secondary">{sessionMeta.status}</Badge>
            <Badge variant="outline">{sessionMeta.durationMinutes} min</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 p-3 sm:p-4">
          <div
            className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-background/40 p-3 sm:p-4"
            style={{ maxHeight: "60vh", minHeight: "300px" }}
          >
            {turns.map((turn, index) => (
              <div
                key={`${turn.speaker}-${index}`}
                className={`animate-slide-up max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${
                  turn.speaker === "candidate"
                    ? "ml-auto rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "rounded-bl-md bg-secondary/60 backdrop-blur-sm"
                }`}
              >
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest opacity-50">
                  {turn.speaker === "candidate" ? "You" : "Interviewer"}
                </p>
                <p className="whitespace-pre-wrap">{turn.text}</p>
                {turn.questionCategory && turn.speaker === "agent" && (
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {turn.questionCategory}
                  </Badge>
                )}
              </div>
            ))}

            {voiceMode && (synthesis.isSpeaking || recognition.isListening) && (
              <div className="flex items-center justify-center gap-2 py-4">
                {synthesis.isSpeaking && (
                  <>
                    <Volume2 className="size-5 animate-pulse text-primary" />
                    <span className="text-xs font-medium text-primary">
                      Interviewer speaking...
                    </span>
                  </>
                )}
                {recognition.isListening && !synthesis.isSpeaking && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="inline-block h-4 w-1 animate-pulse rounded-full bg-primary"
                          style={{ animationDelay: `${i * 150}ms`, height: `${12 + Math.random() * 12}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-primary">Listening...</span>
                  </div>
                )}
              </div>
            )}

            {pending && !synthesis.isSpeaking && (
              <div className="flex items-center justify-center gap-1.5 py-4">
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                voiceMode && recognition.isListening
                  ? "Listening... speak your answer"
                  : "Type your answer..."
              }
              disabled={pending || synthesis.isSpeaking}
              className="min-h-[56px] resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendTurn();
                }
              }}
            />
            <div className="flex flex-col gap-2">
              {voiceMode && voiceSupported ? (
                <Button
                  size="icon"
                  variant={recognition.isListening ? "glow" : "outline"}
                  onClick={toggleMic}
                  disabled={pending || synthesis.isSpeaking}
                  className={recognition.isListening ? "voice-pulse" : ""}
                  aria-label={recognition.isListening ? "Stop listening" : "Start listening"}
                >
                  {recognition.isListening ? (
                    <Mic className="size-4" />
                  ) : (
                    <MicOff className="size-4" />
                  )}
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={sendTurn}
                  disabled={pending || !message.trim()}
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void finishInterview()}
                disabled={pending}
                aria-label="End interview"
              >
                <Square className="size-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {voiceMode ? (
              <span className="flex items-center gap-1.5">
                <Headphones className="size-3" />
                Speak your answer — auto-sends after a pause. Use headphones to avoid echo.
              </span>
            ) : (
              "Enter to send, Shift+Enter for newline"
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="hidden xl:block">
        <CardHeader>
          <CardTitle className="text-base">Session info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { label: "Persona", value: sessionMeta.personaName },
            { label: "Type", value: sessionMeta.interviewType },
            { label: "Duration", value: `${sessionMeta.durationMinutes} min` },
            { label: "Turns", value: String(turns.length) },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">{sessionMeta.status}</Badge>
          </div>

          {voiceMode && (
            <>
              <Separator className="my-2" />
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary">Voice mode active</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recognition.isListening
                    ? "Mic is live — speak your answer"
                    : synthesis.isSpeaking
                      ? "Interviewer is speaking..."
                      : pending
                        ? "Processing your response..."
                        : "Voice ready"}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
