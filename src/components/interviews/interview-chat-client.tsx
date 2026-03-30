"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, MicOff, Send, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

  // Auto-start interview
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
      toast.success("Interview finished");
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
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border">
          <div>
            <CardTitle>{sessionMeta.personaName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{sessionMeta.interviewType}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {voiceEnabled && voiceSupported && (
              <Button
                variant={voiceMode ? "default" : "ghost"}
                size="sm"
                onClick={toggleVoice}
                className="gap-1.5"
              >
                {voiceMode ? <Volume2 className="size-3.5" /> : <MicOff className="size-3.5" />}
                {voiceMode ? "Voice on" : "Voice off"}
              </Button>
            )}
            <Badge variant="secondary">{sessionMeta.status}</Badge>
            <Badge variant="outline">{sessionMeta.durationMinutes} min</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 p-4">
          <div
            className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-background p-4"
            style={{ maxHeight: "60vh" }}
          >
            {turns.map((turn, index) => (
              <div
                key={`${turn.speaker}-${index}`}
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  turn.speaker === "candidate"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-60">
                  {turn.speaker}
                </p>
                <p>{turn.text}</p>
              </div>
            ))}

            {voiceMode && (synthesis.isSpeaking || recognition.isListening) && (
              <div className="flex items-center justify-center gap-2 py-3">
                {synthesis.isSpeaking && (
                  <>
                    <Volume2 className="size-4 animate-pulse text-primary" />
                    <span className="text-xs font-medium text-primary">
                      Interviewer speaking...
                    </span>
                  </>
                )}
                {recognition.isListening && !synthesis.isSpeaking && (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs font-medium text-primary">Listening...</span>
                  </>
                )}
              </div>
            )}

            {pending && !synthesis.isSpeaking && (
              <div className="flex items-center justify-center gap-2 py-3">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
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
                  variant={recognition.isListening ? "default" : "outline"}
                  onClick={toggleMic}
                  disabled={pending || synthesis.isSpeaking}
                  className={recognition.isListening ? "voice-pulse" : ""}
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
                >
                  <Send className="size-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void finishInterview()}
                disabled={pending}
              >
                <Square className="size-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {voiceMode
              ? "Speak your answer — auto-sends after a pause. Use headphones to avoid echo."
              : "Enter to send, Shift+Enter for newline"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Persona</span>
            <span className="font-medium">{sessionMeta.personaName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">{sessionMeta.interviewType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">{sessionMeta.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{sessionMeta.durationMinutes} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Turns</span>
            <span className="font-medium tabular-nums">{turns.length}</span>
          </div>
          {voiceMode && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
