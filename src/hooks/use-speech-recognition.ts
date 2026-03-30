"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionCallbacks {
  onTranscript?: (text: string) => void;
  onSilenceTimeout?: (finalText: string) => void;
}

interface UseSpeechRecognitionOptions extends SpeechRecognitionCallbacks {
  silenceMs?: number;
  lang?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionCtor(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => any) | null;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { silenceMs = 2000, lang = "en-US" } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalStopRef = useRef(false);
  const lastFinalLenRef = useRef(0);
  const cbRef = useRef<SpeechRecognitionCallbacks>({});
  cbRef.current = {
    onTranscript: options.onTranscript,
    onSilenceTimeout: options.onSilenceTimeout,
  };

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    if (recognitionRef.current) {
      intentionalStopRef.current = true;
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    lastFinalLenRef.current = 0;
    intentionalStopRef.current = false;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      const displayText = (finalText + interimText).trim();
      if (displayText) cbRef.current.onTranscript?.(displayText);

      if (finalText.length > lastFinalLenRef.current) {
        lastFinalLenRef.current = finalText.length;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const trimmed = finalText.trim();
          if (trimmed.length > 3) {
            cbRef.current.onSilenceTimeout?.(trimmed);
          }
        }, silenceMs);
      }
    };

    recognition.onend = () => {
      if (!intentionalStopRef.current) {
        try { recognition.start(); } catch { setIsListening(false); }
      } else {
        setIsListening(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        console.error("Microphone permission denied");
        intentionalStopRef.current = true;
        setIsListening(false);
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch { /* ignore */ }
  }, [lang, silenceMs]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  return { isListening, isSupported, start, stop };
}
