"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, MicOff, Send, Square, Volume2, Headphones, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InterviewCountdown } from "@/components/interviews/interview-countdown";
import { fetchJson } from "@/lib/fetcher";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import type { PanelInterviewer } from "@/lib/types/domain";

type Turn = {
  id?: string;
  clientId?: string;
  speaker: "agent" | "candidate" | "system";
  text: string;
  questionCategory?: string | null;
  interviewerKey?: string | null;
  pending?: boolean;
};

type SessionStatus = "planned" | "active" | "completed" | "cancelled";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function InterviewChatClient({
  sessionId,
  sessionMeta,
  initialTurns,
  voiceEnabled = false,
  useElevenLabs = false,
  panel = [],
  companyName,
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
  useElevenLabs?: boolean;
  panel?: PanelInterviewer[];
  companyName?: string;
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [started, setStarted] = useState(initialTurns.length > 0);
  const [voiceMode, setVoiceMode] = useState(voiceEnabled);
  const [showCountdown, setShowCountdown] = useState(!started && initialTurns.length === 0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(sessionMeta.status as SessionStatus);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const statusChannelRef = useRef<BroadcastChannel | null>(null);
  const confirmCancelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voiceModeRef = useRef(voiceMode);
  voiceModeRef.current = voiceMode;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const panelMap = useRef(new Map<string, PanelInterviewer>());
  useEffect(() => {
    const m = new Map<string, PanelInterviewer>();
    for (const p of panel) m.set(p.key, p);
    panelMap.current = m;
  }, [panel]);

  const synthesis = useSpeechSynthesis({
    onEnd() {
      if (voiceModeRef.current && !pendingRef.current) {
        recognition.start();
      }
    },
    panel,
    useElevenLabs,
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

  const voiceSupported = recognition.isSupported && synthesis.isSupported && (useElevenLabs || synthesis.voicesReady);

  useEffect(() => {
    if (sessionStatus !== "planned") {
      setStarted(true);
      setShowCountdown(false);
    }
    if (sessionStatus === "completed" || sessionStatus === "cancelled") {
      setPending(false);
      setConfirmCancel(false);
      synthesis.cancel();
      recognition.stop();
    }
  }, [recognition, sessionStatus, synthesis]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = "BroadcastChannel" in window ? new BroadcastChannel("passme-interview-status") : null;
    statusChannelRef.current = channel;

    const handleStatus = (nextStatus: SessionStatus) => {
      setSessionStatus(nextStatus);
    };

    if (channel) {
      channel.onmessage = (event) => {
        const data = event.data as { sessionId?: string; status?: SessionStatus } | null;
        if (!data || data.sessionId !== sessionId || !data.status) return;
        handleStatus(data.status);
      };
    }

    const storageKey = `passme-interview-status:${sessionId}`;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        const data = JSON.parse(event.newValue) as { sessionId?: string; status?: SessionStatus };
        if (data.sessionId === sessionId && data.status) {
          handleStatus(data.status);
        }
      } catch {
        // ignore malformed cross-tab payloads
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
      statusChannelRef.current = null;
    };
  }, [sessionId]);

  const announceSessionStatus = useCallback((nextStatus: SessionStatus) => {
    setSessionStatus(nextStatus);
    if (typeof window === "undefined") return;

    const payload = JSON.stringify({ sessionId, status: nextStatus, updatedAt: Date.now() });
    try {
      window.localStorage.setItem(`passme-interview-status:${sessionId}`, payload);
      window.localStorage.removeItem(`passme-interview-status:${sessionId}`);
    } catch {
      // ignore storage failures
    }

    statusChannelRef.current?.postMessage({ sessionId, status: nextStatus });
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const doStart = useCallback(async () => {
    if (started || pendingRef.current || sessionStatus !== "planned") return;
    try {
      setPending(true);
      const result = await fetchJson<{ firstMessage: string; interviewerKey: string; session?: { status?: SessionStatus } }>("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setTurns([{
        speaker: "agent",
        text: result.firstMessage,
        questionCategory: "opening",
        interviewerKey: result.interviewerKey,
      }]);
      setStarted(true);
      announceSessionStatus(result.session?.status ?? "active");

      if (voiceModeRef.current) {
        synthesis.speakAs(result.firstMessage, result.interviewerKey);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start interview");
    } finally {
      setPending(false);
    }
  }, [announceSessionStatus, sessionId, sessionStatus, started, synthesis]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    void doStart();
  }, [doStart]);

  useEffect(() => {
    if (showCountdown || started || pending) return;
    void doStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCountdown, started, pending]);

  async function sendTurnWithText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pendingRef.current || sessionStatus !== "active") return;

    recognition.stop();
    const candidateTurnId = crypto.randomUUID();
    const candidateTurn: Turn = {
      speaker: "candidate",
      text: trimmed,
      pending: true,
      clientId: candidateTurnId,
    };
    setTurns((prev) => [...prev, candidateTurn]);
    setMessage("");

    try {
      setPending(true);
      const result = await fetchJson<{
        agentMessage: string;
        interviewerKey: string;
        questionCategory: string;
        shouldEnd: boolean;
      }>(`/api/interviews/${sessionId}/next-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateMessage: trimmed }),
      });

      setTurns((prev) =>
        prev.map((turn) =>
          turn.clientId === candidateTurnId
            ? { ...turn, pending: false }
            : turn,
        ),
      );

      setTurns((prev) => [
        ...prev,
        {
          speaker: "agent",
          text: result.agentMessage,
          questionCategory: result.questionCategory,
          interviewerKey: result.interviewerKey,
        },
      ]);

      if (voiceModeRef.current && synthesis.isSupported) {
        synthesis.speakAs(result.agentMessage, result.interviewerKey);
      }

      if (result.shouldEnd) {
        synthesis.cancel();
        recognition.stop();
        await finishInterview();
      }
    } catch (error) {
      setTurns((prev) => prev.filter((turn) => turn.clientId !== candidateTurnId));
      setMessage(trimmed);
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
      announceSessionStatus("completed");
      toast.success("Interview finished - generating review...");
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

  useEffect(() => {
    return () => {
      if (confirmCancelTimeout.current) {
        clearTimeout(confirmCancelTimeout.current);
        confirmCancelTimeout.current = null;
      }
    };
  }, []);

  function handleCancelClick() {
    if (!confirmCancel) {
      setConfirmCancel(true);
      if (confirmCancelTimeout.current) clearTimeout(confirmCancelTimeout.current);
      confirmCancelTimeout.current = setTimeout(() => {
        setConfirmCancel(false);
        confirmCancelTimeout.current = null;
      }, 4000);
      return;
    }
    if (confirmCancelTimeout.current) {
      clearTimeout(confirmCancelTimeout.current);
      confirmCancelTimeout.current = null;
    }
    setConfirmCancel(false);
    void cancelInterview();
  }

  async function cancelInterview() {
    try {
      setPending(true);
      synthesis.cancel();
      recognition.stop();
      await fetchJson(`/api/interviews/${sessionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      announceSessionStatus("cancelled");
      toast.success("Interview cancelled");
      router.push("/interviews/new");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel interview");
    } finally {
      setPending(false);
    }
  }

  if (showCountdown) {
    return (
      <InterviewCountdown
        panel={panel}
        companyName={companyName}
        onComplete={handleCountdownComplete}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="min-w-0">
            <CardTitle className="truncate">
              {panel.length > 1
                ? `Panel Interview${companyName ? ` - ${companyName}` : ""}`
                : panel[0]?.name ?? sessionMeta.personaName}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {sessionMeta.interviewType.replace(/_/g, " ")}
              {panel.length > 1 ? ` - ${panel.length} interviewers` : ""}
            </p>
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
            <Badge variant="secondary">{sessionStatus}</Badge>
            <Badge variant="outline">{sessionMeta.durationMinutes} min</Badge>
            <Button
              variant={confirmCancel ? "destructive" : "ghost"}
              size="sm"
              onClick={handleCancelClick}
              disabled={pending || sessionStatus === "completed" || sessionStatus === "cancelled"}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              <span className="hidden sm:inline">
                {confirmCancel ? "Confirm cancel?" : "Cancel"}
              </span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 p-3 sm:p-4">
          <div
            className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-background/40 p-3 sm:p-4"
            style={{ maxHeight: "60vh", minHeight: "300px" }}
          >
            {turns.map((turn, index) => {
              const interviewer = turn.interviewerKey
                ? panelMap.current.get(turn.interviewerKey)
                : panel[0];
              const isActive = synthesis.isSpeaking && synthesis.activeInterviewerKey === turn.interviewerKey && index === turns.length - 1;

              return (
                <div
                  key={`${turn.speaker}-${index}`}
                  className={`animate-slide-up max-w-[90%] sm:max-w-[85%] ${
                    turn.speaker === "candidate"
                      ? "ml-auto"
                      : ""
                  }`}
                >
                  {turn.speaker === "agent" && interviewer && (
                    <div className="mb-1.5 flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm transition-shadow ${
                          isActive ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                        }`}
                        style={{ backgroundColor: interviewer.avatarColor }}
                      >
                        {getInitials(interviewer.name)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold">{interviewer.name}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{interviewer.role}</span>
                      </div>
                      {isActive && (
                        <Volume2 className="size-3 animate-pulse text-primary" />
                      )}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      turn.speaker === "candidate"
                        ? "rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/10"
                        : "rounded-bl-md bg-secondary/60 backdrop-blur-sm"
                    }`}
                  >
                    {turn.speaker === "candidate" && (
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest opacity-50">
                        You
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{turn.text}</p>
                    {turn.pending && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        Sending...
                      </Badge>
                    )}
                    {turn.questionCategory && turn.speaker === "agent" && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        {turn.questionCategory}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {voiceMode && (synthesis.isSpeaking || recognition.isListening) && (
              <div className="flex items-center justify-center gap-2 py-4">
                {synthesis.isSpeaking && (
                  <>
                    <Volume2 className="size-5 animate-pulse text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {(() => {
                        const speaker = synthesis.activeInterviewerKey
                          ? panelMap.current.get(synthesis.activeInterviewerKey)
                          : null;
                        return speaker ? `${speaker.name} is speaking...` : "Interviewer speaking...";
                      })()}
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
              disabled={pending || synthesis.isSpeaking || sessionStatus !== "active"}
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
                  disabled={pending || synthesis.isSpeaking || sessionStatus !== "active"}
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
                  disabled={pending || !message.trim() || sessionStatus !== "active"}
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void finishInterview()}
                disabled={pending || sessionStatus === "completed" || sessionStatus === "cancelled"}
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
                Speak your answer - auto-sends after a pause. Use headphones to avoid echo.
              </span>
            ) : (
              "Enter to send, Shift+Enter for newline"
            )}
          </p>
        </CardContent>
      </Card>

      {/* Panel sidebar */}
      <Card className="hidden xl:block">
        <CardHeader>
          <CardTitle className="text-base">
            {panel.length > 1 ? "Interview Panel" : "Session info"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {panel.length > 0 ? (
            <div className="space-y-3">
              {panel.map((interviewer) => {
                const isSpeaking = synthesis.isSpeaking && synthesis.activeInterviewerKey === interviewer.key;
                return (
                  <div
                    key={interviewer.key}
                    className={`rounded-xl border p-3 transition-all duration-300 ${
                      isSpeaking
                        ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-shadow ${
                          isSpeaking ? "ring-2 ring-primary/50 shadow-md shadow-primary/20" : ""
                        }`}
                        style={{ backgroundColor: interviewer.avatarColor }}
                      >
                        {getInitials(interviewer.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{interviewer.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{interviewer.role}</p>
                      </div>
                      {isSpeaking && (
                        <div className="ml-auto flex items-center gap-1">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                          <span className="text-[10px] font-medium text-primary">Speaking</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {interviewer.focusAreas.map((area) => (
                        <Badge key={area} variant="outline" className="text-[9px]">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
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
            </>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Turns</span>
            <span className="font-medium">{turns.length}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">{sessionStatus}</Badge>
          </div>

          {voiceMode && (
            <>
              <Separator className="my-2" />
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary">Voice mode active</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recognition.isListening
                    ? "Mic is live - speak your answer"
                    : synthesis.isSpeaking
                      ? (() => {
                          const speaker = synthesis.activeInterviewerKey
                            ? panelMap.current.get(synthesis.activeInterviewerKey)
                            : null;
                          return speaker ? `${speaker.name} is speaking...` : "Interviewer is speaking...";
                        })()
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
