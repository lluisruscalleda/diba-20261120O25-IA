import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  ConceptMeta,
  ExamAttempt,
  Manifest,
  SearchEntry,
  StudentProgressState,
  StudyPlanConfig,
} from '../types/academy';
import { applySm2Review, type Sm2Quality } from '../utils/sm2';

const STORAGE_KEY = 'diba_ia_academy_state_v1';
const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

const DEFAULT_PROGRESS: StudentProgressState = {
  version: 1,
  completedLessons: {},
  solvedExercises: {},
  favorites: [],
  notes: {},
  examAttempts: [],
  missedQuestions: {},
  srsCards: {},
  studyPlan: null,
};

function loadInitialProgress(): StudentProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudentProgressState>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

interface AcademyContextValue {
  manifest: Manifest | null;
  searchIndex: SearchEntry[];
  loading: boolean;
  error: string | null;
  progress: StudentProgressState;
  backendSynced: boolean;
  allConcepts: ConceptMeta[];
  getConceptById: (id: string) => ConceptMeta | undefined;
  toggleLessonComplete: (conceptId: string) => void;
  toggleExerciseSolved: (conceptId: string) => void;
  toggleFavorite: (conceptId: string) => void;
  saveNote: (conceptId: string, text: string) => void;
  recordExamAttempt: (attempt: ExamAttempt) => void;
  reviewSrsCard: (id: string, kind: 'flashcard' | 'question', quality: Sm2Quality) => void;
  saveStudyPlan: (config: StudyPlanConfig) => void;
  toggleStudyPlanTask: (taskId: string) => void;
  exportProgressJson: () => string;
  importProgressJson: (jsonStr: string) => boolean;
  resetProgress: () => void;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StudentProgressState>(loadInitialProgress);
  const [backendSynced, setBackendSynced] = useState<boolean>(false);

  // Load manifest and search index
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [manifestRes, searchRes] = await Promise.all([
          fetch('/data/manifest.json'),
          fetch('/data/search-index.json'),
        ]);
        if (!manifestRes.ok) {
          throw new Error('No s’ha pogut carregar el manifest del curs. Executa scripts/sync_content.mjs.');
        }
        const manifestData = (await manifestRes.json()) as Manifest;
        const searchData = searchRes.ok ? ((await searchRes.json()) as SearchEntry[]) : [];
        if (active) {
          setManifest(manifestData);
          setSearchIndex(searchData);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error desconegut carregant les dades.');
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Optional initial load from local FastAPI backend if running
  useEffect(() => {
    if (!API_BASE) return;
    let active = true;
    fetch(`${API_BASE}/api/state`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { state?: Partial<StudentProgressState> | null } | null) => {
        if (!active || !data) return;
        setBackendSynced(true);
        if (data.state) {
          setProgress((prev) => ({
            ...DEFAULT_PROGRESS,
            ...prev,
            ...data.state,
          }));
        }
      })
      .catch(() => {
        // Silent fallback to localStorage when optional backend is not running
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist to localStorage (and optional backend if reachable)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage quota issues
    }
    if (API_BASE && backendSynced) {
      const controller = new AbortController();
      fetch(`${API_BASE}/api/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: progress }),
        signal: controller.signal,
      }).catch(() => {
        // ignore offline backend
      });
      return () => controller.abort();
    }
    return undefined;
  }, [progress, backendSynced]);

  const allConcepts = useMemo<ConceptMeta[]>(() => {
    if (!manifest) return [];
    return manifest.modules.flatMap((m) => m.concepts);
  }, [manifest]);

  const conceptMap = useMemo<Record<string, ConceptMeta>>(() => {
    const map: Record<string, ConceptMeta> = {};
    for (const c of allConcepts) map[c.id] = c;
    return map;
  }, [allConcepts]);

  const getConceptById = useCallback((id: string) => conceptMap[id], [conceptMap]);

  const toggleLessonComplete = useCallback((conceptId: string) => {
    setProgress((prev) => {
      const next = { ...prev.completedLessons };
      if (next[conceptId]) {
        delete next[conceptId];
      } else {
        next[conceptId] = new Date().toISOString();
      }
      return { ...prev, completedLessons: next };
    });
  }, []);

  const toggleExerciseSolved = useCallback((conceptId: string) => {
    setProgress((prev) => {
      const next = { ...prev.solvedExercises };
      if (next[conceptId]) {
        delete next[conceptId];
      } else {
        next[conceptId] = new Date().toISOString();
      }
      return { ...prev, solvedExercises: next };
    });
  }, []);

  const toggleFavorite = useCallback((conceptId: string) => {
    setProgress((prev) => {
      const exists = prev.favorites.includes(conceptId);
      const favorites = exists
        ? prev.favorites.filter((id) => id !== conceptId)
        : [...prev.favorites, conceptId];
      return { ...prev, favorites };
    });
  }, []);

  const saveNote = useCallback((conceptId: string, text: string) => {
    setProgress((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [conceptId]: text,
      },
    }));
  }, []);

  const recordExamAttempt = useCallback((attempt: ExamAttempt) => {
    setProgress((prev) => {
      const missed = { ...prev.missedQuestions };
      const now = new Date().toISOString();
      for (const ans of attempt.answers) {
        if (!ans.isCorrect) {
          const existing = missed[ans.questionId];
          missed[ans.questionId] = {
            questionId: ans.questionId,
            conceptId: ans.conceptId,
            module: ans.module,
            wrongCount: (existing?.wrongCount ?? 0) + 1,
            correctStreak: 0,
            lastSeenAt: now,
          };
        } else if (missed[ans.questionId]) {
          missed[ans.questionId] = {
            ...missed[ans.questionId],
            correctStreak: missed[ans.questionId].correctStreak + 1,
            lastSeenAt: now,
          };
        }
      }
      return {
        ...prev,
        examAttempts: [attempt, ...prev.examAttempts].slice(0, 200),
        missedQuestions: missed,
      };
    });
  }, []);

  const reviewSrsCard = useCallback(
    (id: string, kind: 'flashcard' | 'question', quality: Sm2Quality) => {
      setProgress((prev) => {
        const updated = applySm2Review(prev.srsCards[id], id, kind, quality);
        return {
          ...prev,
          srsCards: {
            ...prev.srsCards,
            [id]: updated,
          },
        };
      });
    },
    []
  );

  const saveStudyPlan = useCallback((config: StudyPlanConfig) => {
    setProgress((prev) => ({
      ...prev,
      studyPlan: config,
    }));
  }, []);

  const toggleStudyPlanTask = useCallback((taskId: string) => {
    setProgress((prev) => {
      if (!prev.studyPlan) return prev;
      const done = prev.studyPlan.completedTaskIds.includes(taskId);
      const completedTaskIds = done
        ? prev.studyPlan.completedTaskIds.filter((id) => id !== taskId)
        : [...prev.studyPlan.completedTaskIds, taskId];
      return {
        ...prev,
        studyPlan: {
          ...prev.studyPlan,
          completedTaskIds,
        },
      };
    });
  }, []);

  const exportProgressJson = useCallback(() => JSON.stringify(progress, null, 2), [progress]);

  const importProgressJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as Partial<StudentProgressState>;
      if (typeof parsed !== 'object' || parsed === null) return false;
      setProgress({ ...DEFAULT_PROGRESS, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const value = useMemo<AcademyContextValue>(
    () => ({
      manifest,
      searchIndex,
      loading,
      error,
      progress,
      backendSynced,
      allConcepts,
      getConceptById,
      toggleLessonComplete,
      toggleExerciseSolved,
      toggleFavorite,
      saveNote,
      recordExamAttempt,
      reviewSrsCard,
      saveStudyPlan,
      toggleStudyPlanTask,
      exportProgressJson,
      importProgressJson,
      resetProgress,
    }),
    [
      manifest,
      searchIndex,
      loading,
      error,
      progress,
      backendSynced,
      allConcepts,
      getConceptById,
      toggleLessonComplete,
      toggleExerciseSolved,
      toggleFavorite,
      saveNote,
      recordExamAttempt,
      reviewSrsCard,
      saveStudyPlan,
      toggleStudyPlanTask,
      exportProgressJson,
      importProgressJson,
      resetProgress,
    ]
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
};

export function useAcademy(): AcademyContextValue {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error('useAcademy ha d’utilitzar-se dins d’AcademyProvider');
  return ctx;
}
