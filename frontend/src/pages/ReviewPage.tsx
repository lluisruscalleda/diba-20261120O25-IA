import React, { useEffect, useMemo, useState } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { QuizRunner } from '../components/QuizRunner';
import { isDueForReview } from '../utils/sm2';
import type { Flashcard, QuizQuestion } from '../types/academy';

export const ReviewPage: React.FC = () => {
  const { progress, reviewSrsCard, recordExamAttempt } = useAcademy();
  const [tab, setTab] = useState<'flashcards' | 'missed'>('flashcards');
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [showAllCards, setShowAllCards] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/data/all-flashcards.json').then((r) => (r.ok ? r.json() : { cards: [] })),
      fetch('/data/all-questions.json').then((r) => (r.ok ? r.json() : { questions: [] })),
    ]).then(([fcData, qbData]: [{ cards?: Flashcard[] }, { questions?: QuizQuestion[] }]) => {
      if (!cancelled) {
        setAllCards(fcData.cards ?? []);
        setAllQuestions(qbData.questions ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dueCards = useMemo(
    () => allCards.filter((c) => isDueForReview(progress.srsCards[c.id])),
    [allCards, progress.srsCards]
  );

  const missedQuestions = useMemo(() => {
    const activeIds = new Set(
      Object.values(progress.missedQuestions)
        .filter((m) => m.correctStreak < 2)
        .map((m) => m.questionId)
    );
    return allQuestions.filter((q) => activeIds.has(q.id));
  }, [allQuestions, progress.missedQuestions]);

  const activeDeck = showAllCards ? allCards : dueCards;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <RefreshCw className="h-6 w-6 text-indigo-700" />
          Mode Repàs (Repetició Espaiada SM-2)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consolida la memòria a llarg termini repassant les fitxes pendents d’avui i les preguntes
          fallades en tests anteriors.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('flashcards')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold ${
              tab === 'flashcards'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            Flashcards pendents avui ({dueCards.length}/{allCards.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('missed')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${
              tab === 'missed'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Preguntes fallades pendents ({missedQuestions.length})
          </button>
        </div>
      </div>

      {tab === 'flashcards' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {showAllCards
                ? `Mostrant totes les ${allCards.length} flashcards del curs`
                : `Cua diària SM-2: ${dueCards.length} fitxes pendents`}
            </p>
            <button
              type="button"
              onClick={() => setShowAllCards((s) => !s)}
              className="text-xs font-semibold text-indigo-700 hover:underline"
            >
              {showAllCards ? 'Només pendents d’avui' : 'Repassar totes igualment'}
            </button>
          </div>
          <FlashcardDeck
            cards={activeDeck}
            onRate={(cardId, quality) => reviewSrsCard(cardId, 'flashcard', quality)}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          {missedQuestions.length === 0 ? (
            <p className="text-sm text-slate-600">
              No tens preguntes fallades pendents de consolidar. Una pregunta desapareix d’aquesta cua
              quan l’encertes dues vegades consecutives.
            </p>
          ) : (
            <QuizRunner
              questions={missedQuestions}
              config={{
                mode: 'missed',
                title: 'Sessió de repàs de preguntes fallades',
                durationMinutes: Math.max(10, missedQuestions.length * 2),
                questionCount: missedQuestions.length,
                penaltyPerWrong: 0,
                passThreshold: 80,
                theoryWeight: 100,
                practiceWeight: 0,
              }}
              onComplete={recordExamAttempt}
            />
          )}
        </div>
      )}
    </div>
  );
};
