import { z } from "zod";

const coercedStringArray = z.preprocess(
  (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.trim()) {
      return val.split(/,\s*/).map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  },
  z.array(z.string().trim().min(1)),
).default([]);

export type InterviewType =
  | "recruiter_screen"
  | "hiring_manager"
  | "behavioral"
  | "technical_general"
  | "system_design_light";

export type Difficulty = "easy" | "realistic" | "hard";
export type InterestLevel = "low" | "medium" | "high";
export type SessionMode = "text" | "voice";
export type DocumentType =
  | "resume"
  | "job_description"
  | "cover_letter"
  | "application_answer"
  | "company_context";
export type SessionStatus = "planned" | "active" | "completed" | "cancelled";
export type Speaker = "agent" | "candidate" | "system";
export type PersonaKey =
  | "warm_recruiter"
  | "skeptical_manager"
  | "neutral_manager"
  | "detail_oriented_interviewer";

export type PersonaConfig = {
  key: PersonaKey;
  name: string;
  description: string;
  tone: string;
  warmth: number;
  skepticism: number;
  interruptionFrequency: number;
  followUpIntensity: number;
  challengeStyle: "soft" | "balanced" | "sharp";
  focusAreas: string[];
  openingStyle: string;
  closingStyle: string;
};

export type ResumeProfile = {
  professionalSummary: string;
  roles: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    achievements: string[];
    responsibilities: string[];
    skillsUsed: string[];
  }>;
  skills: string[];
  education: string[];
  metrics: string[];
  leadershipSignals: string[];
  domainKeywords: string[];
  uncertainFields?: string[];
};

export type JobAnalysis = {
  titleGuess: string;
  seniority: string;
  coreCompetencies: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  likelyInterviewThemes: string[];
  hiddenSignals: string[];
  likelyConcerns: string[];
};

export type InterviewPlan = {
  sessionObjective: string;
  competencySequence: string[];
  starterQuestions: Array<{
    id: string;
    category: string;
    question: string;
    whyItMatters: string;
  }>;
  followUpRules: string[];
  likelyGapTargets: string[];
  likelyStrengthTargets: string[];
};

export type EvaluationPayload = {
  overallScore: number;
  dimensionScores: {
    clarity: number;
    relevance: number;
    evidence: number;
    structure: number;
    roleFit: number;
    confidence: number;
  };
  summary: string;
  strengths: Array<{ title: string; body: string; sourceTurnIndexes?: number[] }>;
  weaknesses: Array<{
    title: string;
    body: string;
    severity: "low" | "medium" | "high";
    sourceTurnIndexes?: number[];
  }>;
  missedPoints: Array<{ title: string; body: string }>;
  weakAnswerTargets: Array<{
    turnIndex: number;
    originalAnswerExcerpt: string;
    whyWeak: string;
  }>;
};

export type CoachingPayload = {
  rewrittenAnswers: Array<{
    originalTurnIndex: number;
    title: string;
    improvedAnswer: string;
    rationale: string;
  }>;
  nextSteps: Array<{
    title: string;
    body: string;
  }>;
  drills: Array<{
    title: string;
    prompt: string;
  }>;
};

export type PersonaDefinition = PersonaConfig & {
  key: PersonaKey;
  name: string;
  description: string;
};

export type PanelInterviewer = {
  key: string;

  // ── Core identity ──
  name: string;
  ageRange: string;
  role: string;
  department: string;
  seniorityLevel: string;
  yearsExperience: number;
  educationBackground: string;
  careerPath: string;
  companyTenure: string;
  gender: "male" | "female";

  // ── Professional lens ──
  hiringPriorities: string[];
  interviewPhilosophy: string;
  biggestConcerns: string[];
  whatTheyValueMost: string;
  whatFrustratesThem: string;
  strongAnswerDefinition: string;
  domainExpertise: string[];
  decisionMakingStyle: string;
  riskTolerance: string;

  // ── Communication style ──
  warmth: number;
  formalityLevel: string;
  directnessLevel: string;
  patienceLevel: string;
  listeningStyle: string;
  conversationPace: string;
  interruptionTendency: string;
  followUpStyle: string;
  vagueAnswerReaction: string;
  challengeApproach: string;
  preferredAnswerStructure: string;
  challengeStyle: "soft" | "balanced" | "sharp";

  // ── Human texture ──
  personalityTraits: string[];
  hobbies: string[];
  interests: string[];
  senseOfHumor: string;
  energyLevel: string;
  values: string[];
  smallPersonalHabits: string[];
  introStyleInRealLife: string;

  // ── Interview behavior ──
  introStyle: string;
  smallTalkTendency: string;
  startBroadOrSpecific: string;
  questionPreference: string;
  followUpLogic: string;
  escalationLogic: string;
  topicClosingStyle: string;
  handoffStyle: string;
  focusAreas: string[];

  // ── Voice / display ──
  tone: string;
  personality: string;
  voicePreference: string;
  avatarColor: string;
  elevenLabsVoiceId?: string;

  // ── Generated opening ──
  openingMessage?: string;
  skepticism: number;
};

export type CompanyCandidate = {
  name: string;
  industry: string;
  description: string;
  headquarters: string;
  companySize: string;
  website: string;
  confidence: "high" | "medium" | "low";
  disambiguationNote: string;
};

export type CompanyResolutionResult = {
  topMatch: CompanyCandidate;
  alternatives: CompanyCandidate[];
  isAmbiguous: boolean;
  needsConfirmation: boolean;
};

export type CompanyResearch = {
  confirmedName: string;
  industry: string;
  summary: string;
  coreBusinessModel: string;
  productsAndServices: string[];
  targetMarket: string;
  positioning: string;
  missionAndValues: string[];
  strategicPriorities: string[];
  currentInitiatives: string[];
  recentDirection: string;
  hiringCultureSignals: string[];
  teamExpectations: string;
  interviewStyle: string;
  roleContribution: string;
  likelyCompetencyAreas: string[];
  likelyConcernsAboutCandidates: string[];
  confidenceLevel: "high" | "medium" | "low";
  unknowns: string[];
  values: string[];
  currentProjects: string[];
  goals: string[];
  culture: string;
  roleContext: string;
};

export type CVValidationIssue = {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
};

export type CVValidationResult = {
  isValid: boolean;
  issues: CVValidationIssue[];
  suggestions: string[];
};

export type CandidateProfile = {
  id: string;
  fullName: string;
  headline: string | null;
  email: string | null;
  yearsExperience: number | null;
  targetRoles: string[];
  primaryDomain: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type DocumentRecord = {
  id: string;
  candidateProfileId: string;
  type: DocumentType;
  title: string | null;
  sourceFilename: string | null;
  mimeType: string | null;
  rawText: string;
  parsedJson: unknown | null;
  createdAt: number;
  updatedAt: number;
};

export type DocumentChunkRecord = {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  tokenEstimate: number | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: number;
};

export type InterviewSessionRecord = {
  id: string;
  candidateProfileId: string;
  personaId: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  interestLevel: InterestLevel;
  mode: SessionMode;
  durationMinutes: number;
  status: SessionStatus;
  jobDocumentId: string | null;
  planJson: InterviewPlan | null;
  startedAt: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type TranscriptTurnRecord = {
  id: string;
  interviewSessionId: string;
  turnIndex: number;
  speaker: Speaker;
  text: string;
  questionCategory: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: number;
};

export type ScoreRecord = {
  id: string;
  interviewSessionId: string;
  overallScore: number;
  clarityScore: number;
  relevanceScore: number;
  evidenceScore: number;
  structureScore: number;
  roleFitScore: number;
  confidenceScore: number;
  band: string;
  summary: string;
  createdAt: number;
};

export type FeedbackCategory =
  | "strength"
  | "weakness"
  | "missed_point"
  | "rewritten_answer"
  | "next_step";

export type FeedbackItemRecord = {
  id: string;
  interviewSessionId: string;
  category: FeedbackCategory;
  title: string;
  body: string;
  severity: string | null;
  sourceTurnIdsJson: number[] | null;
  createdAt: number;
};

export type Strength = z.infer<typeof strengthSchema>;
export type Weakness = z.infer<typeof weaknessSchema>;
export type MissedPoint = z.infer<typeof missedPointSchema>;
export type WeakAnswerTarget = z.infer<typeof weakAnswerTargetSchema>;
export type RewrittenAnswer = z.infer<
  typeof coachingSchema.shape.rewrittenAnswers
>[number];
export type NextStep = z.infer<typeof coachingSchema.shape.nextSteps>[number];
export type Drill = z.infer<typeof coachingSchema.shape.drills>[number];
export type InterviewerResponse = z.infer<typeof interviewerResponseSchema>;

export const interviewTypeSchema = z.enum([
  "recruiter_screen",
  "hiring_manager",
  "behavioral",
  "technical_general",
  "system_design_light",
]);
export const difficultySchema = z.enum(["easy", "realistic", "hard"]);
export const interestLevelSchema = z.enum(["low", "medium", "high"]);
export const sessionModeSchema = z.enum(["text", "voice"]);
export const documentTypeSchema = z.enum([
  "resume",
  "job_description",
  "cover_letter",
  "application_answer",
  "company_context",
]);
export const sessionStatusSchema = z.enum([
  "planned",
  "active",
  "completed",
  "cancelled",
]);
export const speakerSchema = z.enum(["agent", "candidate", "system"]);
export const personaKeySchema = z.enum([
  "warm_recruiter",
  "skeptical_manager",
  "neutral_manager",
  "detail_oriented_interviewer",
]);
export const feedbackCategorySchema = z.enum([
  "strength",
  "weakness",
  "missed_point",
  "rewritten_answer",
  "next_step",
]);
export const severitySchema = z.enum(["low", "medium", "high"]);

export const interviewerResponseSchema = z.object({
  agentMessage: z.string().trim().min(1),
  interviewerKey: z.string().trim().min(1),
  questionCategory: z.string().trim().min(1),
  shouldEnd: z.boolean(),
  handoffNote: z.string().optional(),
});

export const dimensionScoresSchema = z.object({
  clarity: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
  relevance: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
  evidence: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
  structure: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
  roleFit: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
  confidence: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
});

export const strengthSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  sourceTurnIndexes: z.array(z.number().int().nonnegative()).optional(),
});

export const weaknessSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  severity: severitySchema.default("medium"),
  sourceTurnIndexes: z.array(z.number().int().nonnegative()).optional(),
});

export const missedPointSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export const weakAnswerTargetSchema = z.object({
  turnIndex: z.number().int().nonnegative(),
  originalAnswerExcerpt: z.string().trim().min(1),
  whyWeak: z.string().trim().min(1),
});

export const evaluationSchema = z.object({
  overallScore: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
  dimensionScores: dimensionScoresSchema.default(() => ({ clarity: 50, relevance: 50, evidence: 50, structure: 50, roleFit: 50, confidence: 50 })),
  summary: z.string().trim().min(1).default("Interview evaluation pending."),
  strengths: z.array(strengthSchema).default([]),
  weaknesses: z.array(weaknessSchema).default([]),
  missedPoints: z.array(missedPointSchema).default([]),
  weakAnswerTargets: z.array(weakAnswerTargetSchema).default([]),
});

export const coachingSchema = z.object({
  rewrittenAnswers: z
    .array(
      z.object({
        originalTurnIndex: z.number().int().nonnegative(),
        title: z.string().trim().min(1),
        improvedAnswer: z.string().trim().min(1),
        rationale: z.string().trim().min(1),
      }),
    )
    .default([]),
  nextSteps: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        body: z.string().trim().min(1),
      }),
    )
    .default([]),
  drills: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        prompt: z.string().trim().min(1),
      }),
    )
    .default([]),
});

export const personaConfigSchema = z.object({
  key: personaKeySchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  tone: z.string().trim().min(1),
  warmth: z.number().min(0).max(100),
  skepticism: z.number().min(0).max(100),
  interruptionFrequency: z.number().min(0).max(100),
  followUpIntensity: z.number().min(0).max(100),
  challengeStyle: z.enum(["soft", "balanced", "sharp"]),
  focusAreas: coercedStringArray,
  openingStyle: z.string().trim().min(1),
  closingStyle: z.string().trim().min(1),
});

export const resumeProfileSchema = z.object({
  candidateName: z.string().trim().optional(),
  candidateEmail: z.string().trim().optional(),
  candidateHeadline: z.string().trim().optional(),
  totalYearsExperience: z.preprocess((v) => (typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) || null : null), z.number().nullable().optional()),
  primaryDomain: z.string().trim().optional(),
  professionalSummary: z.string().trim().min(1),
  roles: z.array(
    z.object({
      company: z.string().trim().min(1),
      title: z.string().trim().min(1),
      startDate: z.string().trim().optional(),
      endDate: z.string().trim().optional(),
      achievements: coercedStringArray,
      responsibilities: coercedStringArray,
      skillsUsed: coercedStringArray,
    }),
  ),
  skills: coercedStringArray,
  education: coercedStringArray,
  metrics: coercedStringArray,
  leadershipSignals: coercedStringArray,
  domainKeywords: coercedStringArray,
  uncertainFields: coercedStringArray.optional(),
});

export const jobAnalysisSchema = z.object({
  titleGuess: z.string().trim().min(1),
  seniority: z.string().trim().min(1),
  coreCompetencies: coercedStringArray,
  mustHaveSkills: coercedStringArray,
  niceToHaveSkills: coercedStringArray,
  likelyInterviewThemes: coercedStringArray,
  hiddenSignals: coercedStringArray,
  likelyConcerns: coercedStringArray,
});

export const panelCoreSchema = z.object({
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  ageRange: z.string().trim().min(1).default("35-45"),
  role: z.string().trim().min(1).default("Interviewer"),
  department: z.string().trim().min(1).default("Engineering"),
  seniorityLevel: z.string().trim().min(1).default("Senior"),
  yearsExperience: z.number().min(0).default(10),
  educationBackground: z.string().trim().min(1).default("University degree"),
  careerPath: z.string().trim().min(1).default("Progressive career growth"),
  companyTenure: z.string().trim().min(1).default("3 years"),
  gender: z.enum(["male", "female"]).default("male"),
  hiringPriorities: z.array(z.string()).default([]),
  interviewPhilosophy: z.string().trim().min(1).default("Structured and fair"),
  biggestConcerns: z.array(z.string()).default([]),
  whatTheyValueMost: z.string().trim().min(1).default("Clarity and ownership"),
  whatFrustratesThem: z.string().trim().min(1).default("Vague answers"),
  domainExpertise: z.array(z.string()).default([]),
  warmth: z.number().min(0).max(100).default(55),
  skepticism: z.number().min(0).max(100).default(50),
  challengeStyle: z.enum(["soft", "balanced", "sharp"]).default("balanced"),
  focusAreas: z.array(z.string()).default([]),
  tone: z.string().trim().min(1).default("professional"),
  personality: z.string().trim().min(1).default("Professional interviewer"),
  voicePreference: z.string().trim().min(1).default("default"),
  avatarColor: z.string().trim().min(1).default("#6366f1"),
  openingMessage: z.string().optional(),
});

export const panelEnrichmentSchema = z.object({
  key: z.string().trim().min(1),
  strongAnswerDefinition: z.string().trim().min(1).default("Specific with metrics"),
  decisionMakingStyle: z.string().trim().min(1).default("Data-driven"),
  riskTolerance: z.string().trim().min(1).default("Moderate"),
  formalityLevel: z.string().trim().min(1).default("Professional but approachable"),
  directnessLevel: z.string().trim().min(1).default("Moderately direct"),
  patienceLevel: z.string().trim().min(1).default("Patient"),
  listeningStyle: z.string().trim().min(1).default("Active listener"),
  conversationPace: z.string().trim().min(1).default("Moderate"),
  interruptionTendency: z.string().trim().min(1).default("Rarely interrupts"),
  followUpStyle: z.string().trim().min(1).default("Probing follow-ups"),
  vagueAnswerReaction: z.string().trim().min(1).default("Asks for specific examples"),
  challengeApproach: z.string().trim().min(1).default("Constructive pushback"),
  preferredAnswerStructure: z.string().trim().min(1).default("STAR"),
  personalityTraits: z.array(z.string()).default([]),
  hobbies: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  senseOfHumor: z.string().trim().min(1).default("Dry and understated"),
  energyLevel: z.string().trim().min(1).default("Calm and steady"),
  values: z.array(z.string()).default([]),
  smallPersonalHabits: z.array(z.string()).default([]),
  introStyleInRealLife: z.string().trim().min(1).default("Firm handshake, warm smile"),
  introStyle: z.string().trim().min(1).default("Introduces self naturally"),
  smallTalkTendency: z.string().trim().min(1).default("Brief and warm"),
  startBroadOrSpecific: z.string().trim().min(1).default("Starts broad"),
  questionPreference: z.string().trim().min(1).default("Behavioral"),
  followUpLogic: z.string().trim().min(1).default("Probe weak areas"),
  escalationLogic: z.string().trim().min(1).default("Increase challenge for strong answers"),
  topicClosingStyle: z.string().trim().min(1).default("Summarizes before moving on"),
  handoffStyle: z.string().trim().min(1).default("Natural transition"),
});

export const panelInterviewerSchema = z.object({
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  ageRange: z.string().trim().min(1).default("35-45"),
  role: z.string().trim().min(1).default("Interviewer"),
  department: z.string().trim().min(1).default("Engineering"),
  seniorityLevel: z.string().trim().min(1).default("Senior"),
  yearsExperience: z.preprocess((v) => (typeof v === "number" ? v : 10), z.number().min(0)).default(10),
  educationBackground: z.string().trim().min(1).default("University degree"),
  careerPath: z.string().trim().min(1).default("Progressive career growth"),
  companyTenure: z.string().trim().min(1).default("3 years"),
  gender: z.enum(["male", "female"]).default("male"),

  hiringPriorities: coercedStringArray,
  interviewPhilosophy: z.string().trim().min(1).default("Structured and fair"),
  biggestConcerns: coercedStringArray,
  whatTheyValueMost: z.string().trim().min(1).default("Clarity and ownership"),
  whatFrustratesThem: z.string().trim().min(1).default("Vague answers"),
  strongAnswerDefinition: z.string().trim().min(1).default("Specific, metric-driven, and structured"),
  domainExpertise: coercedStringArray,
  decisionMakingStyle: z.string().trim().min(1).default("Data-driven"),
  riskTolerance: z.string().trim().min(1).default("Moderate"),

  warmth: z.preprocess((v) => (typeof v === "number" ? v : 55), z.number().min(0).max(100)).default(55),
  formalityLevel: z.string().trim().min(1).default("Professional but approachable"),
  directnessLevel: z.string().trim().min(1).default("Moderately direct"),
  patienceLevel: z.string().trim().min(1).default("Patient"),
  listeningStyle: z.string().trim().min(1).default("Active listener"),
  conversationPace: z.string().trim().min(1).default("Moderate"),
  interruptionTendency: z.string().trim().min(1).default("Rarely interrupts"),
  followUpStyle: z.string().trim().min(1).default("Probing follow-ups"),
  vagueAnswerReaction: z.string().trim().min(1).default("Asks for specific examples"),
  challengeApproach: z.string().trim().min(1).default("Constructive pushback"),
  preferredAnswerStructure: z.string().trim().min(1).default("STAR or structured narrative"),
  challengeStyle: z.enum(["soft", "balanced", "sharp"]).default("balanced"),

  personalityTraits: coercedStringArray,
  hobbies: coercedStringArray,
  interests: coercedStringArray,
  senseOfHumor: z.string().trim().min(1).default("Dry and understated"),
  energyLevel: z.string().trim().min(1).default("Calm and steady"),
  values: coercedStringArray,
  smallPersonalHabits: coercedStringArray,
  introStyleInRealLife: z.string().trim().min(1).default("Firm handshake, warm smile"),

  introStyle: z.string().trim().min(1).default("Introduces self with name and role"),
  smallTalkTendency: z.string().trim().min(1).default("Brief and warm"),
  startBroadOrSpecific: z.string().trim().min(1).default("Starts broad, then narrows"),
  questionPreference: z.string().trim().min(1).default("Behavioral and situational"),
  followUpLogic: z.string().trim().min(1).default("Probe for depth on weak answers"),
  escalationLogic: z.string().trim().min(1).default("Increase challenge if initial answers are strong"),
  topicClosingStyle: z.string().trim().min(1).default("Summarizes before moving on"),
  handoffStyle: z.string().trim().min(1).default("Natural verbal transition to colleague"),
  focusAreas: coercedStringArray,

  tone: z.string().trim().min(1).default("professional, warm but probing"),
  personality: z.string().trim().min(1).default("Professional and thoughtful interviewer"),
  voicePreference: z.string().trim().min(1).default("default"),
  avatarColor: z.string().trim().min(1).default("#6366f1"),
  elevenLabsVoiceId: z.string().optional(),

  openingMessage: z.string().optional(),
  skepticism: z.preprocess((v) => (typeof v === "number" ? v : 50), z.number().min(0).max(100)).default(50),
});

export const companyCandidateSchema = z.object({
  name: z.string().trim().min(1),
  industry: z.string().trim().min(1).default("Unknown"),
  description: z.string().trim().min(1).default("No description available."),
  headquarters: z.string().trim().min(1).default("Unknown"),
  companySize: z.string().trim().min(1).default("Unknown"),
  website: z.string().trim().min(1).default("Unknown"),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  disambiguationNote: z.string().trim().default(""),
});

export const companyResolutionSchema = z.object({
  topMatch: companyCandidateSchema,
  alternatives: z.array(companyCandidateSchema).default([]),
  isAmbiguous: z.preprocess((v) => (typeof v === "boolean" ? v : false), z.boolean()).default(false),
  needsConfirmation: z.preprocess((v) => (typeof v === "boolean" ? v : true), z.boolean()).default(true),
});

export const companyResearchSchema = z.object({
  confirmedName: z.string().trim().min(1),
  industry: z.string().trim().min(1).default("Technology"),
  summary: z.string().trim().min(1),
  coreBusinessModel: z.string().trim().min(1).default("Unknown"),
  productsAndServices: coercedStringArray,
  targetMarket: z.string().trim().min(1).default("Unknown"),
  positioning: z.string().trim().min(1).default("Unknown"),
  missionAndValues: coercedStringArray,
  strategicPriorities: coercedStringArray,
  currentInitiatives: coercedStringArray,
  recentDirection: z.string().trim().min(1).default("Unknown"),
  hiringCultureSignals: coercedStringArray,
  teamExpectations: z.string().trim().min(1).default("Unknown"),
  interviewStyle: z.string().trim().min(1),
  roleContribution: z.string().trim().min(1).default("Unknown"),
  likelyCompetencyAreas: coercedStringArray,
  likelyConcernsAboutCandidates: coercedStringArray,
  confidenceLevel: z.enum(["high", "medium", "low"]).default("medium"),
  unknowns: coercedStringArray,
  values: coercedStringArray,
  currentProjects: coercedStringArray,
  goals: coercedStringArray,
  culture: z.string().trim().min(1),
  roleContext: z.string().trim().min(1),
});

export const cvValidationResultSchema = z.object({
  isValid: z.preprocess((v) => (typeof v === "boolean" ? v : true), z.boolean()).default(true),
  issues: z.array(z.object({
    field: z.string().trim().min(1).default("unknown"),
    severity: z.enum(["error", "warning", "info"]).default("info"),
    message: z.string().trim().min(1),
  })).default([]),
  suggestions: coercedStringArray,
});

export const interviewPlanSchema = z.object({
  sessionObjective: z.string().trim().min(1).default("Assess candidate fit for the target role."),
  competencySequence: coercedStringArray,
  starterQuestions: z.array(
    z.object({
      id: z.string().trim().min(1).default("q_auto"),
      category: z.string().trim().min(1).default("general"),
      question: z.string().trim().min(1),
      whyItMatters: z.string().trim().min(1).default("Validates candidate capability."),
    }),
  ).default([]),
  followUpRules: coercedStringArray,
  likelyGapTargets: coercedStringArray,
  likelyStrengthTargets: coercedStringArray,
});
