import type { SrsCardState } from '../types/academy';

/**
 * Qualitat de resposta SM-2:
 * 1 = De nou (oblit complet)
 * 3 = Difícil (recordat amb esforç)
 * 4 = Bé (recordat correctament)
 * 5 = Fàcil (recordat immediatament)
 */
export type Sm2Quality = 1 | 3 | 4 | 5;

export function createInitialSrsState(id: string, kind: 'flashcard' | 'question'): SrsCardState {
  const now = new Date().toISOString();
  return {
    id,
    kind,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: now,
    lastReviewedAt: now,
  };
}

export function applySm2Review(
  prev: SrsCardState | undefined,
  id: string,
  kind: 'flashcard' | 'question',
  quality: Sm2Quality
): SrsCardState {
  const current = prev ?? createInitialSrsState(id, kind);
  let { easeFactor, intervalDays, repetitions } = current;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    Number((easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))).toFixed(2))
  );

  const now = new Date();
  const next = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    id,
    kind,
    easeFactor,
    intervalDays,
    repetitions,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: next.toISOString(),
  };
}

export function isDueForReview(state: SrsCardState | undefined, now = new Date()): boolean {
  if (!state) return true;
  return new Date(state.nextReviewAt).getTime() <= now.getTime();
}
