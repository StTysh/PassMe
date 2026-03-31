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
  for (const pattern of FEMALE_PATTERNS) {
    if (name.includes(pattern)) return "female";
  }
  for (const pattern of MALE_PATTERNS) {
    if (name.includes(pattern)) return "male";
  }
  return "unknown";
}

function getTotalByteLength(chunks: ArrayBuffer[]) {
  return chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
}

async function readStreamToBlob(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: ArrayBuffer[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      chunks.push(copy.buffer);
    }
    if (done) {
      break;
    }
  }

  if (getTotalByteLength(chunks) === 0) {
    throw new Error("TTS stream was empty.");
  }

  return new Blob(chunks, { type: "audio/mpeg" });
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const browserVoicePoolRef = useRef<Map<string, { voice: SpeechSynthesisVoice; rate: number; pitch: number }>>(new Map());
  const allBrowserVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingQueueRef = useRef<Array<{ text: string; interviewerKey?: string }>>([]);
  const onVoicesChangedRef = useRef<(() => void) | null>(null);

  const clearSpeakingState = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }

    setIsSpeaking(false);
    setActiveInterviewerKey(null);
  }, []);

  const assignBrowserVoicesToPanel = useCallback(() => {
    const voices = allBrowserVoicesRef.current;
    browserVoicePoolRef.current.clear();
    if (!voices.length) return;

    const panel = cbRef.current.panel;
    if (!panel?.length) {
      const preferred = voices.find((v) => v.name.includes("Google US English"))
        ?? voices.find((v) => v.name.includes("Aria"))
        ?? voices[0];

      if (preferred) {
        browserVoicePoolRef.current.set("interviewer_1", {
          voice: preferred,
          rate: 1.05,
          pitch: 1.0,
        });
      }
      return;
    }

    const classified = voices.map((voice) => ({ voice, gender: classifyVoiceGender(voice) }));
    const femaleVoices = classified.filter((item) => item.gender === "female").map((item) => item.voice);
    const maleVoices = classified.filter((item) => item.gender === "male").map((item) => item.voice);
    const unknownVoices = classified.filter((item) => item.gender === "unknown").map((item) => item.voice);

    let femaleIdx = 0;
    let maleIdx = 0;
    const rateVariations = [1.0, 1.08, 0.95];
    const pitchVariations = [1.0, 1.1, 0.9];

    for (const interviewer of panel) {
      const wantsFemale = interviewer.gender === "female";
      const pool = wantsFemale
        ? (femaleVoices.length > 0 ? femaleVoices : unknownVoices.length > 0 ? unknownVoices : voices)
        : (maleVoices.length > 0 ? maleVoices : unknownVoices.length > 0 ? unknownVoices : voices);
      const poolIndex = wantsFemale ? femaleIdx : maleIdx;

      browserVoicePoolRef.current.set(interviewer.key, {
        voice: pool[poolIndex % pool.length],
        rate: rateVariations[poolIndex % rateVariations.length],
        pitch: pitchVariations[poolIndex % pitchVariations.length],
      });

      if (wantsFemale) {
        femaleIdx += 1;
      } else {
        maleIdx += 1;
      }
    }
  }, []);

  useEffect(() => {
    if (options.useElevenLabs) {
      setIsSupported(true);
      setVoicesReady(true);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      setVoicesReady(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
      const usableVoices = englishVoices.length > 0 ? englishVoices : voices;

      allBrowserVoicesRef.current = usableVoices;
      setVoicesReady(usableVoices.length > 0);
      assignBrowserVoicesToPanel();
    };

    loadVoices();
    onVoicesChangedRef.current = loadVoices;

    const synth = window.speechSynthesis as SpeechSynthesis & {
      addEventListener?: (type: string, listener: EventListener) => void;
      removeEventListener?: (type: string, listener: EventListener) => void;
      onvoiceschanged?: (() => void) | null;
    };

    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", loadVoices as EventListener);
      return () => {
        synth.removeEventListener?.("voiceschanged", loadVoices as EventListener);
      };
    }

    const previousHandler = synth.onvoiceschanged ?? null;
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = previousHandler;
    };
  }, [assignBrowserVoicesToPanel, options.useElevenLabs]);

  useEffect(() => {
    if (!options.useElevenLabs) {
      assignBrowserVoicesToPanel();
    }
  }, [assignBrowserVoicesToPanel, options.panel, options.useElevenLabs]);

  const doBrowserSpeak = useCallback((text: string, interviewerKey?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!allBrowserVoicesRef.current.length) {
      pendingQueueRef.current.push({ text, interviewerKey });
      setVoicesReady(false);
      return;
    }

    clearSpeakingState();
    window.speechSynthesis.cancel();

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
      clearSpeakingState();
      cbRef.current.onEnd?.();
    };
    utterance.onerror = () => {
      clearSpeakingState();
    };

    window.speechSynthesis.speak(utterance);

    keepAliveRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearSpeakingState();
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
  }, [clearSpeakingState]);

  const playBlobAudio = useCallback(async (blob: Blob, interviewerKey: string) => {
    clearSpeakingState();

    const url = URL.createObjectURL(blob);
    audioBlobUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      clearSpeakingState();
      cbRef.current.onEnd?.();
    };
    audio.onerror = () => {
      clearSpeakingState();
    };

    setIsSpeaking(true);
    setActiveInterviewerKey(interviewerKey);
    await audio.play();
  }, [clearSpeakingState]);

  const doElevenLabsSpeak = useCallback(async (text: string, interviewerKey?: string, retryCount = 0): Promise<void> => {
    const key = interviewerKey ?? "interviewer_1";
    const panel = cbRef.current.panel;
    const interviewer = panel?.find((item) => item.key === key);
    const voiceId = interviewer?.elevenLabsVoiceId;

    if (!voiceId) {
      if (retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return doElevenLabsSpeak(text, interviewerKey, retryCount + 1);
      }
      doBrowserSpeak(text, interviewerKey);
      return;
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok || !response.body) {
        throw new Error("TTS request failed.");
      }

      const blob = await readStreamToBlob(response.body as ReadableStream<Uint8Array>);
      await playBlobAudio(blob, key);
    } catch {
      clearSpeakingState();
      doBrowserSpeak(text, interviewerKey);
    }
  }, [clearSpeakingState, doBrowserSpeak, playBlobAudio]);

  const speakAs = useCallback((text: string, interviewerKey?: string) => {
    if (elevenLabsEnabledRef.current) {
      void doElevenLabsSpeak(text, interviewerKey);
      return;
    }

    doBrowserSpeak(text, interviewerKey);
  }, [doBrowserSpeak, doElevenLabsSpeak]);

  const speak = useCallback((text: string) => {
    speakAs(text, "interviewer_1");
  }, [speakAs]);

  useEffect(() => {
    if (!voicesReady) return;

    const drainQueue = () => {
      const item = pendingQueueRef.current.shift();
      if (!item) return;
      assignBrowserVoicesToPanel();
      speakAs(item.text, item.interviewerKey);
    };

    drainQueue();
    const interval = setInterval(drainQueue, 500);
    return () => clearInterval(interval);
  }, [assignBrowserVoicesToPanel, speakAs, voicesReady]);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    pendingQueueRef.current = [];
    clearSpeakingState();
  }, [clearSpeakingState]);

  useEffect(() => {
    return () => {
      pendingQueueRef.current = [];
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      clearSpeakingState();
    };
  }, [clearSpeakingState]);

  return { isSpeaking, isSupported, voicesReady, activeInterviewerKey, speak, speakAs, cancel };
}
