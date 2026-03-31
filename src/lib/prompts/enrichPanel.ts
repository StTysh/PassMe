import { panelEnrichmentSchema } from "@/lib/types/domain";
import { z } from "zod";
import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

const enrichmentArraySchema = z.array(panelEnrichmentSchema);

export function buildEnrichPanelPrompt(
  coreInterviewers: Array<{ key: string; name: string; role: string; personality: string; gender: string; warmth: number; challengeStyle: string; focusAreas: string[] }>,
  companyName: string,
  jobTitle: string,
): PromptDefinition<typeof enrichmentArraySchema> {
  const systemInstruction = jsonOnlyInstruction(
    `You are a character depth writer specializing in making fictional professionals feel psychologically real. You will receive basic interviewer profiles and your job is to add rich human texture, specific communication habits, and detailed interview behavior that makes each person feel alive and distinct. Every field must be specific and original — never generic.`,
  );

  const interviewerSummaries = coreInterviewers.map((i, idx) =>
    joinPromptSections(
      `INTERVIEWER ${idx + 1} (key: "${i.key}"):`,
      `Name: ${i.name}`,
      `Role: ${i.role}`,
      `Gender: ${i.gender}`,
      `Personality: ${i.personality}`,
      `Warmth: ${i.warmth}/100`,
      `Challenge style: ${i.challengeStyle}`,
      `Focus areas: ${i.focusAreas.join(", ")}`,
    ),
  ).join("\n\n");

  const userPrompt = joinPromptSections(
    `Enrich these ${coreInterviewers.length} interviewer persona(s) at ${companyName} for a ${jobTitle} interview. Add human texture and detailed behavior to each one.`,
    interviewerSummaries,
    joinPromptSections(
      "For EACH interviewer, generate these fields (use their key to match):",
      "",
      "COMMUNICATION DETAIL:",
      "- strongAnswerDefinition: what a great answer looks like to THIS person specifically",
      "- decisionMakingStyle: how they form opinions (e.g., 'needs data before committing', 'trusts gut after patterns')",
      "- riskTolerance: their stance on hiring risk",
      "- formalityLevel: their conversational register (e.g., 'casual but professional — uses first names, occasional humor')",
      "- directnessLevel: how blunt they are",
      "- patienceLevel: how much runway they give answers before redirecting",
      "- listeningStyle: physical and verbal listening cues",
      "- conversationPace: how fast they move through topics",
      "- interruptionTendency: when and how they interrupt",
      "- followUpStyle: how they dig deeper (be specific and vivid)",
      "- vagueAnswerReaction: what exactly they do when answers lack substance",
      "- challengeApproach: how they push back (include example phrasing)",
      "- preferredAnswerStructure: what format they want from candidates",
      "",
      "HUMAN TEXTURE (be creative and specific — this is what makes them feel real):",
      "- personalityTraits: 3-5 traits as a person, not just professional",
      "- hobbies: 2-3 specific hobbies (e.g., 'trail running', 'restoring vintage synthesizers')",
      "- interests: broader intellectual interests",
      "- senseOfHumor: describe specifically (e.g., 'dry one-liners with a slight smile')",
      "- energyLevel: their general vibe (e.g., 'calm and measured — never seems rushed')",
      "- values: 2-3 personal values that show in their work",
      "- smallPersonalHabits: 1-2 humanizing details (e.g., 'always has coffee nearby')",
      "- introStyleInRealLife: how they'd introduce themselves at a dinner party",
      "",
      "INTERVIEW BEHAVIOR:",
      "- introStyle: how they actually open interviews (write it conversationally)",
      "- smallTalkTendency: do they small-talk, and about what?",
      "- startBroadOrSpecific: how they begin their line of questioning",
      "- questionPreference: behavioral, technical, strategic, culture, situational, etc.",
      "- followUpLogic: their reasoning for when to follow up",
      "- escalationLogic: how they increase difficulty",
      "- topicClosingStyle: how they wrap up a topic",
      "- handoffStyle: how they transition to another interviewer (with example language)",
    ),
    "CRITICAL: Each interviewer must feel distinctly different. Their hobbies, humor, pace, and questioning style should clearly set them apart. No two interviewers should have the same energy.",
    "Return a JSON array of enrichment objects, each with a 'key' field matching the interviewer.",
  );

  return {
    name: "enrichPanel",
    systemInstruction,
    userPrompt,
    responseSchema: enrichmentArraySchema,
    temperature: 0.7,
    maxOutputTokens: 4096,
  };
}
