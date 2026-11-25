export type Difficulty = 'basic' | 'intermediate' | 'advanced';
export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type QuestionType =
  | 'conceptual'
  | 'code'
  | 'architecture'
  | 'metrics'
  | 'case-study'
  | 'normative';

export interface ConceptMeta {
  id: string;
  order: number;
  title: string;
  module: number;
  moduleSlug: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  tags: string[];
  crossReferences: string[];
  hasLesson: boolean;
  questionCount: number;
  flashcardCount: number;
  lessonPath: string | null;
  questionBankPath: string | null;
  flashcardsPath: string | null;
}

export interface ModuleMeta {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  concepts: ConceptMeta[];
  readyLessons: number;
  totalConcepts: number;
}

export interface LabMeta {
  id: string;
  module: number;
  title: string;
  path: string;
  description: string;
  available: boolean;
  readmePath: string | null;
}

export interface ExamMetaSummary {
  id: string;
  title: string;
  module?: number;
  questionCount?: number;
  modules?: number[];
  difficulty?: Difficulty;
  path: string;
}

export interface Manifest {
  generatedAt: string;
  title: string;
  institution: string;
  stats: {
    totalModules: number;
    totalConcepts: number;
    readyLessons: number;
    totalQuestions: number;
    totalFlashcards: number;
    glossaryCount: number;
    moduleExamsCount: number;
    globalMocksCount: number;
    practicalCasesCount: number;
    fullSimulationsCount: number;
    labsReady: number;
    finalProjectAvailable: boolean;
  };
  modules: ModuleMeta[];
  labs: LabMeta[];
  exams: {
    moduleExams: ExamMetaSummary[];
    globalMocks: ExamMetaSummary[];
    practicalCases: ExamMetaSummary[];
    fullSimulations: ExamMetaSummary[];
  };
  finalProject: {
    title: string;
    available: boolean;
    readmePath: string | null;
  };
}

export interface SearchEntry {
  type: 'lesson' | 'glossary';
  id: string;
  module: number;
  moduleTitle: string;
  title: string;
  tags: string[];
  excerpt: string;
  url: string;
}

export interface QuestionOption {
  key: OptionKey;
  text: string;
}

export interface QuizQuestion {
  id: string;
  module: number;
  conceptId: string;
  lessonRef: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  prompt: string;
  codeSnippet?: string | null;
  options: QuestionOption[];
  correctOption: OptionKey;
  explanationCorrect: string;
  explanationsIncorrect: Partial<Record<OptionKey, string>>;
}

export interface Flashcard {
  id: string;
  module: number;
  conceptId: string;
  front: string;
  back: string;
  tags: string[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  english: string;
  module: number;
  conceptId: string;
  definition: string;
}

export interface ExamConfig {
  mode: 'concept' | 'module' | 'global' | 'missed' | 'adaptive' | 'custom-file';
  title: string;
  durationMinutes: number;
  questionCount: number;
  penaltyPerWrong: number; // e.g., 0, 0.25, 0.33, 0.5
  passThreshold: number; // 0-100 percentage
  theoryWeight: number; // 0-100 percentage
  practiceWeight: number; // 0-100 percentage
  moduleId?: number;
  conceptId?: string;
}

export interface QuestionAnswerRecord {
  questionId: string;
  conceptId: string;
  module: number;
  selectedOption: OptionKey | null;
  correctOption: OptionKey;
  isCorrect: boolean;
}

export interface ExamAttempt {
  id: string;
  date: string;
  mode: ExamConfig['mode'];
  title: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  rawScorePercent: number;
  penalizedScorePercent: number;
  passed: boolean;
  durationSeconds: number;
  config: ExamConfig;
  answers: QuestionAnswerRecord[];
}

export interface SrsCardState {
  id: string;
  kind: 'flashcard' | 'question';
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string; // ISO date
  lastReviewedAt: string;
}

export interface StudyPlanConfig {
  totalDays: 15 | 30 | 45 | 60 | 90;
  hoursPerDay: number;
  initialLevel: 'beginner' | 'intermediate' | 'advanced';
  startDate: string; // YYYY-MM-DD
  completedTaskIds: string[];
}

export interface MissedQuestionRecord {
  questionId: string;
  conceptId: string;
  module: number;
  wrongCount: number;
  correctStreak: number;
  lastSeenAt: string;
}

export interface StudentProgressState {
  version: number;
  completedLessons: Record<string, string>;
  solvedExercises: Record<string, string>;
  favorites: string[];
  notes: Record<string, string>;
  examAttempts: ExamAttempt[];
  missedQuestions: Record<string, MissedQuestionRecord>;
  srsCards: Record<string, SrsCardState>;
  studyPlan: StudyPlanConfig | null;
}

export interface PracticalCase {
  id: string;
  title: string;
  modules: number[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  context: string;
  statement: string;
  requirements: string[];
  rubric: { criterion: string; maxPoints: number; description: string }[];
  modelSolution: string;
  alternativeApproaches?: string[];
}
