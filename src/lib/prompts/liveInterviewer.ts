import {
  interviewerResponseSchema,
  type PanelInterviewer,
  type CompanyResearch,
} from "@/lib/types/domain";

import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

function buildInterviewerProfile(p: PanelInterviewer): string {
  return [
    `[${p.key}] ${p.name}, ${p.role} - ${p.personality}`,
    `  Style: tone=${p.tone}, warmth=${p.warmth}/100, skepticism=${p.skepticism}/100, challenge=${p.challengeStyle}, pace=${p.conversationPace}, directness=${p.directnessLevel}`,
    `  Behavior: follow-ups=${p.followUpStyle}; vague answers=${p.vagueAnswerReaction}; challenge=${p.challengeApproach}; handoff=${p.handoffStyle}`,
    `  Priorities: ${p.hiringPriorities.join(", ")}. Focus: ${p.focusAreas.join(", ")}. Questions: ${p.questionPreference}`,
    `  Values: ${p.whatTheyValueMost}. Frustrates: ${p.whatFrustratesThem}. Traits: ${p.personalityTraits.join(", ")}`,
  ].join("\n");
}

export interface LiveInterviewerInput {
  panel: PanelInterviewer[];
  companyResearch?: CompanyResearch | null;
  interviewType: string;
  difficulty: string;
  sessionObjective: string;
  recentTranscript: Array<{ speaker: string; text: string; interviewerKey?: string | null }>;
  contextSnippets: string[];
  remainingQuestions: number;
  followUpBudget: number;
}

export function buildLiveInterviewerPrompt(
  input: LiveInterviewerInput | Record<string, unknown>,
): PromptDefinition<typeof interviewerResponseSchema> {
  const i = input as LiveInterviewerInput;
  const panel = i.panel ?? [];
  const hasMultiple = panel.length > 1;

  const systemInstruction = jsonOnlyInstruction(
    hasMultiple
      ? `You are a hyper-realistic interview panel simulator. You control ${panel.length} distinct interviewers who take turns asking questions. Each interviewer is a fully realized professional with a unique personality, communication style, and set of priorities. Your job is to choose which interviewer speaks next and write their turn EXACTLY as that specific person would say it - matching their tone, warmth, directness, humor, and questioning style precisely. The interview should feel like a real, flowing conversation between professionals who know each other. NEVER produce generic interviewer language. Every sentence must sound like it comes from the specific interviewer's mouth.`
      : `You are a hyper-realistic interview simulator. You are playing the role of one specific interviewer - a fully realized professional with a distinct personality, communication style, and perspective. Every word you produce must sound like this actual person speaking in a real interview. Match their tone, warmth, directness, pace, and questioning style exactly. NEVER produce generic interviewer language. Sound human, not like a template.`,
  );

  const cr = i.companyResearch;
  const companySection = cr
    ? joinPromptSections(
        "COMPANY CONTEXT:",
        `Company: ${cr.confirmedName ?? "Unknown"} (${cr.industry ?? "Unknown"})`,
        cr.summary,
        cr.coreBusinessModel ? `Business model: ${cr.coreBusinessModel}` : null,
        cr.missionAndValues?.length ? `Values: ${cr.missionAndValues.join(", ")}` : `Values: ${cr.values.join(", ")}`,
        `Culture: ${cr.culture}`,
        cr.strategicPriorities?.length ? `Priorities: ${cr.strategicPriorities.join(", ")}` : null,
        cr.roleContribution ? `Role contribution: ${cr.roleContribution}` : `Role context: ${cr.roleContext}`,
        cr.hiringCultureSignals?.length ? `Hiring culture: ${cr.hiringCultureSignals.join("; ")}` : null,
        cr.likelyCompetencyAreas?.length ? `Competency areas: ${cr.likelyCompetencyAreas.join(", ")}` : null,
        cr.likelyConcernsAboutCandidates?.length ? `Likely concerns: ${cr.likelyConcernsAboutCandidates.join(", ")}` : null,
      )
    : null;

  const panelSection = panel.length > 0
    ? joinPromptSections(
        "INTERVIEWER PROFILES (use these to shape EVERY response):",
        ...panel.map(buildInterviewerProfile),
      )
    : null;

  const coordinationRules = hasMultiple
    ? joinPromptSections(
        "PANEL COORDINATION RULES:",
        "- Choose which interviewer speaks next based on conversation flow and each interviewer's focus areas.",
        "- Do NOT let the same interviewer speak more than 2 turns in a row.",
        "- When transitioning, the new speaker should briefly acknowledge the previous answer or question naturally.",
        "- Transitions should sound like real colleagues: 'Thanks, that's helpful. I'd love to explore the technical side a bit - [question]' NOT 'Now I will ask about technical topics.'",
        "- Each interviewer's turn must sound distinctly like THEM - not a generic interviewer.",
        "- For closing: the lead interviewer (interviewer_1) should wrap up.",
        `- The interviewerKey MUST be one of: ${panel.map((p) => `'${p.key}'`).join(", ")}`,
      )
    : null;

  const singleInterviewerRules = !hasMultiple && panel[0]
    ? joinPromptSections(
        "VOICE RULES:",
        `You ARE ${panel[0].name}. Every word must sound like ${panel[0].name} - match their tone (${panel[0].tone}), warmth level (${panel[0].warmth}/100), directness (${panel[0].directnessLevel}), and humor style (${panel[0].senseOfHumor}).`,
        `When following up: ${panel[0].followUpStyle}`,
        `When the candidate is vague: ${panel[0].vagueAnswerReaction}`,
        `When challenging: ${panel[0].challengeApproach}`,
        `When closing a topic: ${panel[0].topicClosingStyle}`,
        `Always use interviewerKey: '${panel[0].key}'`,
      )
    : null;

  const transcriptText = i.recentTranscript
    .map((turn) => {
      if (turn.speaker === "agent" && turn.interviewerKey) {
        const interviewer = panel.find((p) => p.key === turn.interviewerKey);
        const prefix = interviewer ? `${interviewer.name} [${turn.interviewerKey}]` : turn.interviewerKey;
        return `${prefix}: ${turn.text}`;
      }
      return `${turn.speaker}: ${turn.text}`;
    })
    .join("\n");

  const userPrompt = joinPromptSections(
    companySection,
    panelSection,
    coordinationRules,
    singleInterviewerRules,
    `Interview type: ${i.interviewType}`,
    `Difficulty: ${i.difficulty}`,
    `Session objective: ${i.sessionObjective}`,
    `Remaining question budget: ${i.remainingQuestions}`,
    `Remaining follow-up budget: ${i.followUpBudget}`,
    joinPromptSections(
      "RESPONSE QUALITY RULES:",
      "- Ask ONE question at a time.",
      "- Sound like a real person, not a prompt. No bullet lists. No markdown.",
      "- Reference the candidate's actual answers when relevant.",
      "- Probe weak or vague answers, then move on when you have enough signal.",
      "- Do not leak the scoring rubric.",
      "- Keep responses concise and conversational - real interviewers don't give speeches.",
      "- Use natural language: contractions, casual transitions, brief reactions ('Interesting...', 'Got it.', 'Hmm, tell me more about that.').",
      "- Do NOT start with the candidate's name or 'Great question' type phrases.",
    ),
    transcriptText ? `CONVERSATION SO FAR:\n${transcriptText}` : null,
    i.contextSnippets.length
      ? joinPromptSections(
          "CANDIDATE CONTEXT FROM THEIR RESUME:",
          i.contextSnippets.map((s) => `- ${s}`).join("\n"),
        )
      : null,
    "Return JSON: { agentMessage: string, interviewerKey: string, questionCategory: string | null, shouldEnd: boolean, handoffNote: string | null }. Include questionCategory every time, and use null for handoffNote when no handoff note is needed.",
  );

  return {
    name: "liveInterviewer",
    systemInstruction,
    userPrompt,
    responseSchema: interviewerResponseSchema,
    temperature: 0.55,
    maxOutputTokens: 4096,
  };
}
