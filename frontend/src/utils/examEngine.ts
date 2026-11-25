import type {
  ExamAttempt,
  ExamConfig,
  MissedQuestionRecord,
  OptionKey,
  QuestionAnswerRecord,
  QuizQuestion,
} from '../types/academy';

export interface ScoreSummary {
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  rawScorePercent: number;
  penalizedScorePercent: number;
  passed: boolean;
  answers: QuestionAnswerRecord[];
}

export function evaluateExam(
  questions: QuizQuestion[],
  selectedAnswers: Record<string, OptionKey | null>,
  config: ExamConfig
): ScoreSummary {
  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;

  const answers: QuestionAnswerRecord[] = questions.map((q) => {
    const selected = selectedAnswers[q.id] ?? null;
    const isCorrect = selected !== null && selected === q.correctOption;
    if (selected === null) {
      blankCount += 1;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
    return {
      questionId: q.id,
      conceptId: q.conceptId,
      module: q.module,
      selectedOption: selected,
      correctOption: q.correctOption,
      isCorrect,
    };
  });

  const total = Math.max(questions.length, 1);
  const rawScorePercent = Number(((correctCount / total) * 100).toFixed(1));
  const netPoints = Math.max(0, correctCount - wrongCount * config.penaltyPerWrong);
  const penalizedScorePercent = Number(((netPoints / total) * 100).toFixed(1));
  const passed = penalizedScorePercent >= config.passThreshold;

  return {
    correctCount,
    wrongCount,
    blankCount,
    rawScorePercent,
    penalizedScorePercent,
    passed,
    answers,
  };
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface ConceptMastery {
  conceptId: string;
  attempts: number;
  accuracy: number; // 0-100
  missedCount: number;
}

export function computeConceptMastery(
  attempts: ExamAttempt[],
  missedQuestions: Record<string, MissedQuestionRecord>
): Record<string, ConceptMastery> {
  const stats: Record<string, { total: number; correct: number }> = {};

  for (const attempt of attempts) {
    for (const ans of attempt.answers) {
      if (!stats[ans.conceptId]) {
        stats[ans.conceptId] = { total: 0, correct: 0 };
      }
      stats[ans.conceptId].total += 1;
      if (ans.isCorrect) stats[ans.conceptId].correct += 1;
    }
  }

  const missedByConcept: Record<string, number> = {};
  for (const rec of Object.values(missedQuestions)) {
    if (rec.correctStreak < 2) {
      missedByConcept[rec.conceptId] = (missedByConcept[rec.conceptId] ?? 0) + rec.wrongCount;
    }
  }

  const allConceptIds = new Set([...Object.keys(stats), ...Object.keys(missedByConcept)]);
  const result: Record<string, ConceptMastery> = {};

  for (const conceptId of allConceptIds) {
    const s = stats[conceptId] ?? { total: 0, correct: 0 };
    const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
    result[conceptId] = {
      conceptId,
      attempts: s.total,
      accuracy,
      missedCount: missedByConcept[conceptId] ?? 0,
    };
  }

  return result;
}

/**
 * Selecciona preguntes de forma adaptativa prioritzant:
 * 1) Preguntes fallades prèviament (encara no consolidades)
 * 2) Conceptes amb pitjor precisió històrica
 * 3) Conceptes encara no avaluats
 */
export function selectAdaptiveQuestions(
  allQuestions: QuizQuestion[],
  count: number,
  attempts: ExamAttempt[],
  missedQuestions: Record<string, MissedQuestionRecord>
): QuizQuestion[] {
  const mastery = computeConceptMastery(attempts, missedQuestions);

  const weighted = allQuestions.map((q) => {
    const missed = missedQuestions[q.id];
    const conceptStats = mastery[q.conceptId];
    let weight = 1.0;

    if (missed && missed.correctStreak < 2) {
      weight += 4.0 + Math.min(missed.wrongCount, 4);
    }
    if (!conceptStats || conceptStats.attempts === 0) {
      weight += 1.5;
    } else if (conceptStats.accuracy < 60) {
      weight += 3.0;
    } else if (conceptStats.accuracy < 80) {
      weight += 1.5;
    } else {
      weight += 0.3;
    }

    // Small random jitter so repeated adaptive runs aren't identical
    return { q, score: weight * (0.8 + Math.random() * 0.4) };
  });

  weighted.sort((a, b) => b.score - a.score);
  return weighted.slice(0, count).map((item) => item.q);
}
