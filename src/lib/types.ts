import type { EraId } from './eras';

export type UserRole = 'user' | 'admin';

export interface UserDoc {
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number; // ms since epoch
}

export interface TrackDoc {
  title: string;
  composer?: string;
  era: EraId;
  audioPath: string;      // Firebase Storage path
  ytId: string | null;
  ytStart: number;
  correctAnswer: string;  // canonical text for grading
  createdBy: string;
  createdAt: number;
}

export type QuizTrackSource = 'library' | 'youtube';

export interface QuizTrack {
  source: QuizTrackSource;
  trackId?: string;         // set if source='library'
  title: string;
  composer?: string;
  era: EraId;
  audioPath?: string;       // set if source='library'
  ytId?: string;            // set if source='youtube' OR library fallback
  ytStart?: number;
  correctAnswer: string;
}

export interface QuizDoc {
  ownerId: string;
  title: string;
  description: string;
  isTemplate: boolean;
  tracks: QuizTrack[];
  createdAt: number;
  updatedAt: number;
}

export type AttemptVerdict = 'correct' | 'partial' | 'wrong' | 'skipped';

export interface AttemptResult {
  quizTrack: QuizTrack;
  userAnswer: string;
  verdict: AttemptVerdict;
  score: 0 | 0.5 | 1;
  elapsedMs: number;
}

export interface AttemptDoc {
  userId: string;
  quizId: string;
  quizTitleSnapshot: string;
  startedAt: number;
  finishedAt: number;
  totalQuestions: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  skippedCount: number;
  totalScore: number;       // sum of result.score
  results: AttemptResult[];
}

export interface FeedbackDoc {
  userId: string;
  userEmail: string;
  message: string;
  createdAt: number;
  status: 'new' | 'read' | 'resolved';
}

// Re-export EraId for convenient importing from types.
export type { EraId } from './eras';
