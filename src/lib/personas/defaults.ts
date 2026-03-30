import type { InterestLevel, PersonaConfig, PersonaKey } from "@/lib/types/domain";

import { personaConfigSchema } from "@/lib/types/domain";

export const DEFAULT_PERSONAS: PersonaConfig[] = [
  {
    key: "warm_recruiter",
    name: "Warm Recruiter",
    description:
      "Friendly first-round interviewer focused on fit, motivation, and communication.",
    tone: "encouraging, polished, conversational",
    warmth: 85,
    skepticism: 25,
    interruptionFrequency: 10,
    followUpIntensity: 40,
    challengeStyle: "soft",
    focusAreas: ["motivation", "clarity", "fit", "communication"],
    openingStyle: "friendly and relaxed",
    closingStyle: "supportive and appreciative",
  },
  {
    key: "skeptical_manager",
    name: "Skeptical Hiring Manager",
    description:
      "Demanding interviewer who wants proof, ownership, and measurable impact.",
    tone: "direct, sharp, concise",
    warmth: 35,
    skepticism: 85,
    interruptionFrequency: 35,
    followUpIntensity: 80,
    challengeStyle: "sharp",
    focusAreas: ["ownership", "evidence", "tradeoffs", "impact"],
    openingStyle: "brief and formal",
    closingStyle: "minimal and neutral",
  },
  {
    key: "neutral_manager",
    name: "Neutral Hiring Manager",
    description: "Balanced manager assessing fit, execution, and communication.",
    tone: "calm, professional, neutral",
    warmth: 55,
    skepticism: 55,
    interruptionFrequency: 20,
    followUpIntensity: 60,
    challengeStyle: "balanced",
    focusAreas: ["ownership", "collaboration", "prioritization", "outcomes"],
    openingStyle: "professional and neutral",
    closingStyle: "concise and courteous",
  },
  {
    key: "detail_oriented_interviewer",
    name: "Detail-Oriented Interviewer",
    description:
      "Interviewer who drills into process, edge cases, and technical detail.",
    tone: "analytical, precise",
    warmth: 45,
    skepticism: 70,
    interruptionFrequency: 15,
    followUpIntensity: 90,
    challengeStyle: "balanced",
    focusAreas: ["detail", "process", "metrics", "technical depth"],
    openingStyle: "focused and efficient",
    closingStyle: "brief and matter-of-fact",
  },
];

export const DEFAULT_PERSONA_MAP: Record<PersonaKey, PersonaConfig> = Object.freeze(
  Object.fromEntries(DEFAULT_PERSONAS.map((persona) => [persona.key, persona])) as Record<
    PersonaKey,
    PersonaConfig
  >,
);

export const DEFAULT_PERSONA_DEFINITIONS = [
  {
    key: "warm_recruiter",
    name: "Warm Recruiter",
    description:
      "Friendly first-round interviewer focused on fit, motivation, and communication.",
    config: DEFAULT_PERSONA_MAP.warm_recruiter,
  },
  {
    key: "skeptical_manager",
    name: "Skeptical Hiring Manager",
    description:
      "Demanding interviewer who wants proof, ownership, and measurable impact.",
    config: DEFAULT_PERSONA_MAP.skeptical_manager,
  },
  {
    key: "neutral_manager",
    name: "Neutral Hiring Manager",
    description: "Balanced manager assessing fit, execution, and communication.",
    config: DEFAULT_PERSONA_MAP.neutral_manager,
  },
  {
    key: "detail_oriented_interviewer",
    name: "Detail-Oriented Interviewer",
    description:
      "Interviewer who drills into process, edge cases, and technical detail.",
    config: DEFAULT_PERSONA_MAP.detail_oriented_interviewer,
  },
] as const;

const interestLevelAdjustments: Record<
  InterestLevel,
  {
    warmthDelta: number;
    skepticismDelta: number;
    interruptionFrequencyDelta: number;
    followUpIntensityDelta: number;
    patienceLabel: string;
  }
> = {
  low: {
    warmthDelta: -15,
    skepticismDelta: 10,
    interruptionFrequencyDelta: 10,
    followUpIntensityDelta: 10,
    patienceLabel: "reduced patience and less rescue",
  },
  medium: {
    warmthDelta: 0,
    skepticismDelta: 0,
    interruptionFrequencyDelta: 0,
    followUpIntensityDelta: 0,
    patienceLabel: "neutral patience",
  },
  high: {
    warmthDelta: 10,
    skepticismDelta: -5,
    interruptionFrequencyDelta: -5,
    followUpIntensityDelta: 5,
    patienceLabel: "more patience and more second chances",
  },
};

export function listDefaultPersonas() {
  return [...DEFAULT_PERSONAS];
}

export function seedDefaultPersonas() {
  return listDefaultPersonas();
}

export function getDefaultPersona(key: PersonaKey) {
  return DEFAULT_PERSONA_MAP[key];
}

export function getPersonaByKey(key: PersonaKey) {
  return getDefaultPersona(key);
}

export function clampPersonaValue(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyInterestLevelToPersona(
  persona: PersonaConfig,
  interestLevel: InterestLevel,
) {
  const adjustment = interestLevelAdjustments[interestLevel];
  return personaConfigSchema.parse({
    ...persona,
    warmth: clampPersonaValue(persona.warmth + adjustment.warmthDelta),
    skepticism: clampPersonaValue(persona.skepticism + adjustment.skepticismDelta),
    interruptionFrequency: clampPersonaValue(
      persona.interruptionFrequency + adjustment.interruptionFrequencyDelta,
    ),
    followUpIntensity: clampPersonaValue(
      persona.followUpIntensity + adjustment.followUpIntensityDelta,
    ),
  });
}

export function applyInterestLevel(
  persona: PersonaConfig,
  interestLevel: InterestLevel,
) {
  return applyInterestLevelToPersona(persona, interestLevel);
}

export function personaToConfigJson(
  persona: PersonaConfig,
  interestLevel: InterestLevel = "medium",
) {
  return JSON.stringify(applyInterestLevelToPersona(persona, interestLevel));
}

export function getPersonaBehaviorNotes(interestLevel: InterestLevel) {
  return interestLevelAdjustments[interestLevel].patienceLabel;
}

export function isValidPersonaKey(key: string): key is PersonaKey {
  return key in DEFAULT_PERSONA_MAP;
}
