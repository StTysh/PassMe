"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechSynthesisOptions {
  onEnd?: () => void;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const cbRef = useRef(options);
  cbRef.current = options;
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setIsSupported(true);

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const preferred = [
        "Google US English",
        "Microsoft Aria Online",
        "Microsoft Jenny Online",
        "Microsoft Guy Online",
        "Microsoft Zira",
        "Microsoft David",
        "Microsoft Mark",
        "Samantha",
        "Alex",
      ];

      for (const name of preferred) {
        const match = voices.find((v) => v.name.includes(name));
        if (match) {
          voiceRef.current = match;
          return;
        }
      }

      const eng = voices.find((v) => v.lang.startsWith("en"));
      if (eng) voiceRef.current = eng;
    }

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      cbRef.current.onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    };

    window.speechSynthesis.speak(utterance);

    // Chrome pauses long utterances after ~15s; resume/pause keeps it alive
    keepAliveRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  return { isSpeaking, isSupported, speak, cancel };
}
