import { z } from "zod";

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
export type InterviewerReasoningTag = "new_question" | "follow_up" | "closing";
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

export const interviewerResponseSchema = z
  .object({
    agentMessage: z.string().trim().min(1),
    questionCategory: z.string().trim().min(1),
    shouldFollowUp: z.boolean(),
    shouldEnd: z.boolean(),
    reasoningTag: z.enum(["new_question", "follow_up", "closing"]),
  })
  .strict();

export const dimensionScoresSchema = z
  .object({
    clarity: z.number().min(0).max(100),
    relevance: z.number().min(0).max(100),
    evidence: z.number().min(0).max(100),
    structure: z.number().min(0).max(100),
    roleFit: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
  })
  .strict();

export const strengthSchema = z
  .object({
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    sourceTurnIndexes: z.array(z.number().int().nonnegative()).optional(),
  })
  .strict();

export const weaknessSchema = z
  .object({
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    severity: severitySchema,
    sourceTurnIndexes: z.array(z.number().int().nonnegative()).optional(),
  })
  .strict();

export const missedPointSchema = z
  .object({
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
  })
  .strict();

export const weakAnswerTargetSchema = z
  .object({
    turnIndex: z.number().int().nonnegative(),
    originalAnswerExcerpt: z.string().trim().min(1),
    whyWeak: z.string().trim().min(1),
  })
  .strict();

export const evaluationSchema = z
  .object({
    overallScore: z.number().min(0).max(100),
    dimensionScores: dimensionScoresSchema,
    summary: z.string().trim().min(1),
    strengths: z.array(strengthSchema).default([]),
    weaknesses: z.array(weaknessSchema).default([]),
    missedPoints: z.array(missedPointSchema).default([]),
    weakAnswerTargets: z.array(weakAnswerTargetSchema).default([]),
  })
  .strict();

export const coachingSchema = z
  .object({
    rewrittenAnswers: z
      .array(
        z
          .object({
            originalTurnIndex: z.number().int().nonnegative(),
            title: z.string().trim().min(1),
            improvedAnswer: z.string().trim().min(1),
            rationale: z.string().trim().min(1),
          })
          .strict(),
      )
      .default([]),
    nextSteps: z
      .array(
        z
          .object({
            title: z.string().trim().min(1),
            body: z.string().trim().min(1),
          })
          .strict(),
      )
      .default([]),
    drills: z
      .array(
        z
          .object({
            title: z.string().trim().min(1),
            prompt: z.string().trim().min(1),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

export const personaConfigSchema = z
  .object({
    key: personaKeySchema,
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    tone: z.string().trim().min(1),
    warmth: z.number().min(0).max(100),
    skepticism: z.number().min(0).max(100),
    interruptionFrequency: z.number().min(0).max(100),
    followUpIntensity: z.number().min(0).max(100),
    challengeStyle: z.enum(["soft", "balanced", "sharp"]),
    focusAreas: z.array(z.string().trim().min(1)).default([]),
    openingStyle: z.string().trim().min(1),
    closingStyle: z.string().trim().min(1),
  })
  .strict();

export const resumeProfileSchema = z
  .object({
    professionalSummary: z.string().trim().min(1),
    roles: z.array(
      z
        .object({
          company: z.string().trim().min(1),
          title: z.string().trim().min(1),
          startDate: z.string().trim().optional(),
          endDate: z.string().trim().optional(),
          achievements: z.array(z.string().trim().min(1)).default([]),
          responsibilities: z.array(z.string().trim().min(1)).default([]),
          skillsUsed: z.array(z.string().trim().min(1)).default([]),
        })
        .strict(),
    ),
    skills: z.array(z.string().trim().min(1)).default([]),
    education: z.array(z.string().trim().min(1)).default([]),
    metrics: z.array(z.string().trim().min(1)).default([]),
    leadershipSignals: z.array(z.string().trim().min(1)).default([]),
    domainKeywords: z.array(z.string().trim().min(1)).default([]),
    uncertainFields: z.array(z.string().trim().min(1)).default([]).optional(),
  })
  .strict();

export const jobAnalysisSchema = z
  .object({
    titleGuess: z.string().trim().min(1),
    seniority: z.string().trim().min(1),
    coreCompetencies: z.array(z.string().trim().min(1)).default([]),
    mustHaveSkills: z.array(z.string().trim().min(1)).default([]),
    niceToHaveSkills: z.array(z.string().trim().min(1)).default([]),
    likelyInterviewThemes: z.array(z.string().trim().min(1)).default([]),
    hiddenSignals: z.array(z.string().trim().min(1)).default([]),
    likelyConcerns: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const interviewPlanSchema = z
  .object({
    sessionObjective: z.string().trim().min(1),
    competencySequence: z.array(z.string().trim().min(1)).default([]),
    starterQuestions: z.array(
      z
        .object({
          id: z.string().trim().min(1),
          category: z.string().trim().min(1),
          question: z.string().trim().min(1),
          whyItMatters: z.string().trim().min(1),
        })
        .strict(),
    ),
    followUpRules: z.array(z.string().trim().min(1)).default([]),
    likelyGapTargets: z.array(z.string().trim().min(1)).default([]),
    likelyStrengthTargets: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();
