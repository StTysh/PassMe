"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PanelInterviewer } from "@/lib/types/domain";

interface UseSpeechSynthesisOptions {
  onEnd?: () => void;
  panel?: PanelInterviewer[];
  useElevenLabs?: boolean;
}

const FEMALE_PATTERNS = [
  "Aria", "Jenny", "Zira", "Samantha", "Karen", "Moira", "Tessa", "Susan", "Hazel",
  "Ava", "Clara", "Elsa", "Eva", "Fiona", "Heera", "Linda", "Michelle", "Neerja",
  "Natasha", "Sonia", "Sara", "Libby", "Emily", "Olivia", "Sophie",
  "Female", "Woman",
];
const MALE_PATTERNS = [
  "Guy", "David", "Mark", "Alex", "Daniel", "James", "George", "Fred",
  "Ryan", "Eric", "Christopher", "Roger", "Richard", "Sean", "Liam", "Ravi",
  "Steffan", "Thomas", "William", "Andrew", "Connor",
  "Male", "Man",
];

function classifyVoiceGender(voice: SpeechSynthesisVoice): "male" | "female" | "unknown" {
  const name = voice.name;
  for (const pat of FEMALE_PATTERNS) if (name.includes(pat)) return "female";
  for (const pat of MALE_PATTERNS) if (name.includes(pat)) return "male";
  return "unknown";
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [activeInterviewerKey, setActiveInterviewerKey] = useState<string | null>(null);

  const cbRef = useRef(options);
  cbRef.current = options;
  const elevenLabsEnabledRef = useRef(options.useElevenLabs ?? false);
  elevenLabsEnabledRef.current = options.useElevenLabs ?? false;
  const isSupportedRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  const browserVoicePoolRef = useRef<Map<string, { voice: SpeechSynthesisVoice; rate: number; pitch: number }>>(new Map());
  const allBrowserVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingQueueRef = useRef<Array<{ text: string; interviewerKey?: string }>>([]);

  useEffect(() => {
    if (options.useElevenLabs) {
      isSupportedRef.current = true;
      setIsSupported(true);
      setVoicesReady(true);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    isSupportedRef.current = true;
    setIsSupported(true);

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      allBrowserVoicesRef.current = voices.filter((v) => v.lang.startsWith("en"));
      setVoicesReady(true);
      assignBrowserVoicesToPanel();
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [options.useElevenLabs]);

  useEffect(() => {
    if (!options.useElevenLabs) assignBrowserVoicesToPanel();
  }, [options.panel, options.useElevenLabs]);

  function assignBrowserVoicesToPanel() {
    const voices = allBrowserVoicesRef.current;
    if (!voices.length) return;

    const panel = cbRef.current.panel;
    if (!panel?.length) {
      const preferred = voices.find((v) => v.name.includes("Google US English"))
        ?? voices.find((v) => v.name.includes("Aria"))
        ?? voices[0];
      if (preferred) {
        browserVoicePoolRef.current.set("interviewer_1", { voice: preferred, rate: 1.05, pitch: 1.0 });
      }
      return;
    }

    const classified = voices.map((v) => ({ voice: v, gender: classifyVoiceGender(v) }));
    const femaleVoices = classified.filter((v) => v.gender === "female").map((v) => v.voice);
    const maleVoices = classified.filter((v) => v.gender === "male").map((v) => v.voice);
    const unknownVoices = classified.filter((v) => v.gender === "unknown").map((v) => v.voice);

    let femaleIdx = 0;
    let maleIdx = 0;
    const rateVariations = [1.0, 1.08, 0.95];
    const pitchVariations = [1.0, 1.1, 0.9];
    let fVarIdx = 0;
    let mVarIdx = 0;

    for (const interviewer of panel) {
      if (interviewer.gender === "female") {
        const pool = femaleVoices.length > 0 ? femaleVoices : unknownVoices.length > 0 ? unknownVoices : voices;
        browserVoicePoolRef.current.set(interviewer.key, {
          voice: pool[femaleIdx % pool.length],
          rate: rateVariations[fVarIdx % rateVariations.length],
          pitch: pitchVariations[fVarIdx % pitchVariations.length],
        });
        femaleIdx++;
        fVarIdx++;
      } else {
        const pool = maleVoices.length > 0 ? maleVoices : unknownVoices.length > 0 ? unknownVoices : voices;
        browserVoicePoolRef.current.set(interviewer.key, {
          voice: pool[maleIdx % pool.length],
          rate: rateVariations[mVarIdx % rateVariations.length],
          pitch: pitchVariations[mVarIdx % pitchVariations.length],
        });
        maleIdx++;
        mVarIdx++;
      }
    }
  }

  function doBrowserSpeak(text: string, interviewerKey?: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!allBrowserVoicesRef.current.length) {
      pendingQueueRef.current.push({ text, interviewerKey });
      return;
    }

    window.speechSynthesis.cancel();
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    const key = interviewerKey ?? "interviewer_1";
    const config = browserVoicePoolRef.current.get(key);

    const utterance = new SpeechSynthesisUtterance(text);
    if (config?.voice) utterance.voice = config.voice;
    utterance.rate = config?.rate ?? 1.05;
    utterance.pitch = config?.pitch ?? 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveInterviewerKey(key);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveInterviewerKey(null);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      cbRef.current.onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveInterviewerKey(null);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    };

    window.speechSynthesis.speak(utterance);

    keepAliveRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
  }

  async function doElevenLabsSpeak(text: string, interviewerKey?: string, retryCount = 0) {
    const key = interviewerKey ?? "interviewer_1";
    const panel = cbRef.current.panel;
    const interviewer = panel?.find((p) => p.key === key);
    const voiceId = interviewer?.elevenLabsVoiceId;

    if (!voiceId) {
      if (retryCount < 3) {
        await new Promise((r) => setTimeout(r, 200));
        return doElevenLabsSpeak(text, interviewerKey, retryCount + 1);
      }
      console.warn(`[TTS] No ElevenLabs voiceId for ${key} after retries, skipping speech`);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }

    setIsSpeaking(true);
    setActiveInterviewerKey(key);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        setIsSpeaking(false);
        setActiveInterviewerKey(null);
        doBrowserSpeak(text, interviewerKey);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const blob = await response.blob();
        playBlobAudio(blob, key);
        return;
      }

      const chunks: ArrayBuffer[] = [];
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (value) chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));

        if (!started && getTotalByteLength(chunks) > 4096) {
          started = true;
          const partialBlob = new Blob(chunks, { type: "audio/mpeg" });
          playBlobAudio(partialBlob, key, false);
        }

        if (done) break;
      }

      if (!started) {
        const fullBlob = new Blob(chunks, { type: "audio/mpeg" });
        playBlobAudio(fullBlob, key);
      } else {
        const fullBlob = new Blob(chunks, { type: "audio/mpeg" });
        const url = URL.createObjectURL(fullBlob);
        const currentAudio = audioRef.current as HTMLAudioElement | null;
        if (currentAudio) {
          const pos = currentAudio.currentTime;
          const wasPlaying = !currentAudio.paused;
          URL.revokeObjectURL(audioBlobUrlRef.current ?? "");
          audioBlobUrlRef.current = url;
          currentAudio.src = url;
          currentAudio.currentTime = pos;
          if (wasPlaying) currentAudio.play().catch(() => {});
        } else {
          URL.revokeObjectURL(url);
        }
      }
    } catch {
      setIsSpeaking(false);
      setActiveInterviewerKey(null);
      doBrowserSpeak(text, interviewerKey);
    }
  }

  function getTotalByteLength(chunks: ArrayBuffer[]): number {
    let len = 0;
    for (const c of chunks) len += c.byteLength;
    return len;
  }

  function playBlobAudio(blob: Blob, key: string, isFinal = true) {
    const url = URL.createObjectURL(blob);
    if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
    audioBlobUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setIsSpeaking(false);
      setActiveInterviewerKey(null);
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
      audioRef.current = null;
      cbRef.current.onEnd?.();
    };

    audio.onerror = () => {
      if (!isFinal) return;
      setIsSpeaking(false);
      setActiveInterviewerKey(null);
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
      audioRef.current = null;
    };

    audio.play().catch(() => {});
  }

  const speakAs = useCallback((text: string, interviewerKey?: string) => {
    if (elevenLabsEnabledRef.current) {
      void doElevenLabsSpeak(text, interviewerKey);
    } else {
      doBrowserSpeak(text, interviewerKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = useCallback((text: string) => {
    speakAs(text, "interviewer_1");
  }, [speakAs]);

  useEffect(() => {
    if (!voicesReady) return;
    function drainQueue() {
      while (pendingQueueRef.current.length > 0) {
        const item = pendingQueueRef.current.shift();
        if (item) {
          assignBrowserVoicesToPanel();
          speakAs(item.text, item.interviewerKey);
          break;
        }
      }
    }
    drainQueue();
    const interval = setInterval(drainQueue, 500);
    return () => clearInterval(interval);
  }, [voicesReady, speakAs]);

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    setIsSpeaking(false);
    setActiveInterviewerKey(null);
  }, []);

  useEffect(() => {
    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
    };
  }, []);

  return { isSpeaking, isSupported, voicesReady, activeInterviewerKey, speak, speakAs, cancel };
}
