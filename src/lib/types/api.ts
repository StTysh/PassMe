import type {
  CoachingPayload,
  Difficulty,
  DocumentType,
  EvaluationPayload,
  InterviewPlan,
  InterviewType,
  InterestLevel,
  PersonaKey,
  SessionMode,
  SessionStatus,
  Strength,
  Weakness,
} from "@/lib/types/domain";

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiSuccessResponse<TPayload extends object = Record<string, never>> = {
  ok: true;
} & TPayload;

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorPayload;
}

export type ApiResponse<TPayload extends object = Record<string, never>> =
  | ApiSuccessResponse<TPayload>
  | ApiErrorResponse;

export interface CandidateProfileSummary {
  id: string;
  fullName: string;
  headline?: string | null;
  email?: string | null;
  yearsExperience?: number | null;
  targetRoles: string[];
  primaryDomain?: string | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentSummary {
  id: string;
  candidateProfileId: string;
  type: DocumentType;
  title?: string | null;
  sourceFilename?: string | null;
  mimeType?: string | null;
  hasParsedJson: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface InterviewSessionSummary {
  id: string;
  candidateProfileId: string;
  personaId: string;
  personaKey: PersonaKey;
  personaName: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  interestLevel: InterestLevel;
  mode: SessionMode;
  durationMinutes: number;
  status: SessionStatus;
  jobDocumentId?: string | null;
  startedAt?: number | null;
  completedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TranscriptTurnSummary {
  id: string;
  interviewSessionId: string;
  turnIndex: number;
  speaker: string;
  text: string;
  questionCategory?: string | null;
  createdAt: number;
}

export interface ScoreSummary {
  id: string;
  interviewSessionId: string;
  overallScore: number;
  band: string;
  summary: string;
  createdAt: number;
}

export interface FeedbackItemSummary {
  id: string;
  interviewSessionId: string;
  category: string;
  title: string;
  body: string;
  severity?: string | null;
  sourceTurnIds: number[];
  createdAt: number;
}

export interface ProfileCreateRequest {
  fullName: string;
  headline?: string;
  email?: string;
  yearsExperience?: number | null;
  targetRoles?: string[];
  primaryDomain?: string;
  notes?: string;
}

export interface ProfileUpdateRequest extends ProfileCreateRequest {
  id: string;
}

export interface DocumentUploadResponse {
  ok: true;
  documentId: string;
  type: DocumentType;
  title?: string;
}

export interface DocumentParseResponse {
  ok: true;
  documentId: string;
  parsed: unknown;
}

export interface InterviewPlanResponse {
  ok: true;
  sessionId: string;
  plan: InterviewPlan;
}

export interface InterviewStartResponse {
  ok: true;
  firstMessage: string;
  session: InterviewSessionSummary;
}

export interface NextTurnResponse {
  ok: true;
  agentMessage: string;
  questionCategory?: string;
  shouldEnd: boolean;
}

export interface FinishInterviewResponse {
  ok: true;
  reviewReady: boolean;
}

export interface ReviewResponse {
  ok: true;
  scores: EvaluationPayload;
  feedback: {
    strengths: Strength[];
    weaknesses: Weakness[];
    missedPoints: EvaluationPayload["missedPoints"];
    rewrittenAnswers: CoachingPayload["rewrittenAnswers"];
    nextSteps: CoachingPayload["nextSteps"];
  };
}

export interface HistorySessionRow {
  id: string;
  candidateProfileId: string;
  candidateName: string;
  personaKey: PersonaKey;
  personaName: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  interestLevel: InterestLevel;
  overallScore: number;
  band: string;
  completedAt: number;
  createdAt: number;
  deltaFromPrevious?: number | null;
  biggestImprovementArea?: string | null;
}

export interface HistoryResponse {
  ok: true;
  sessions: HistorySessionRow[];
  summary: {
    totalSessions: number;
    averageScore: number | null;
    bestScore: number | null;
    biggestImprovementArea?: string | null;
  };
}

export interface SearchResultItem {
  id: string;
  scope: "documents" | "transcripts";
  title: string;
  snippet: string;
  sourceId: string;
  score?: number;
}

export interface SearchResponse {
  ok: true;
  results: SearchResultItem[];
}
