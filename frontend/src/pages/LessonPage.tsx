import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileText,
  Layers,
  Star,
} from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { QuizRunner } from '../components/QuizRunner';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { splitLessonIntoSections } from '../utils/markdownBlocks';
import type { ExamConfig, Flashcard, QuizQuestion } from '../types/academy';

type ViewMode = 'all' | 'theory' | 'practice' | 'quiz' | 'flashcards' | 'notes';

export const LessonPage: React.FC = () => {
  const { conceptId } = useParams<{ conceptId: string }>();
  const {
    allConcepts,
    getConceptById,
    progress,
    toggleLessonComplete,
    toggleExerciseSolved,
    toggleFavorite,
    saveNote,
    recordExamAttempt,
    reviewSrsCard,
  } = useAcademy();

  const concept = conceptId ? getConceptById(conceptId) : undefined;
  const [markdown, setMarkdown] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingLesson, setLoadingLesson] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  useEffect(() => {
    setViewMode('all');
    if (!concept || !concept.hasLesson || !concept.lessonPath) {
      setMarkdown('');
      setQuestions([]);
      setFlashcards([]);
      return;
    }

    let cancelled = false;
    setLoadingLesson(true);

    async function fetchLessonAssets() {
      if (!concept?.lessonPath) return;
      try {
        const [mdRes, qbRes, fcRes] = await Promise.all([
          fetch(concept.lessonPath),
          concept.questionBankPath ? fetch(concept.questionBankPath) : Promise.resolve(null),
          concept.flashcardsPath ? fetch(concept.flashcardsPath) : Promise.resolve(null),
        ]);

        const mdText = mdRes.ok ? await mdRes.text() : '';
        const qbData =
          qbRes && qbRes.ok
            ? ((await qbRes.json()) as { questions?: QuizQuestion[] }).questions ?? []
            : [];
        const fcData =
          fcRes && fcRes.ok
            ? ((await fcRes.json()) as { cards?: Flashcard[] }).cards ?? []
            : [];

        if (!cancelled) {
          setMarkdown(mdText);
          setQuestions(qbData);
          setFlashcards(fcData);
          setLoadingLesson(false);
        }
      } catch {
        if (!cancelled) {
          setLoadingLesson(false);
        }
      }
    }

    void fetchLessonAssets();
    return () => {
      cancelled = true;
    };
  }, [concept]);

  const parsed = useMemo(() => splitLessonIntoSections(markdown), [markdown]);

  const currentIdx = allConcepts.findIndex((c) => c.id === conceptId);
  const prevConcept = currentIdx > 0 ? allConcepts[currentIdx - 1] : null;
  const nextConcept =
    currentIdx >= 0 && currentIdx < allConcepts.length - 1 ? allConcepts[currentIdx + 1] : null;

  if (!concept) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">Concepte no trobat</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-indigo-700">
          Tornar al Dashboard
        </Link>
      </div>
    );
  }

  const isCompleted = Boolean(progress.completedLessons[concept.id]);
  const isExerciseSolved = Boolean(progress.solvedExercises[concept.id]);
  const isFavorite = progress.favorites.includes(concept.id);
  const noteText = progress.notes[concept.id] ?? '';

  const conceptQuizConfig: ExamConfig = {
    mode: 'concept',
    title: `Test individual · ${concept.title}`,
    durationMinutes: 15,
    questionCount: questions.length,
    penaltyPerWrong: 0.25,
    passThreshold: 60,
    theoryWeight: 100,
    practiceWeight: 0,
    moduleId: concept.module,
    conceptId: concept.id,
  };

  if (!concept.hasLesson) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-2xs">
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
            MÒDUL {concept.module} · CONCEPTE {concept.order}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{concept.title}</h1>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Lliçó planificada dins del full de ruta incremental</p>
            <p className="mt-1">
              Aquest concepte forma part de la matriu oficial de cobertura (<code>COVERAGE.md</code>) i
              es desenvoluparà seqüencialment amb els 10 apartats obligatoris (A–J), exercici
              independent amb solució oculta, mínim 10 preguntes tipus test, 3 preguntes de
              desenvolupament i flashcards.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            {prevConcept ? (
              <Link
                to={`/lliço/${prevConcept.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {prevConcept.title}
              </Link>
            ) : (
              <span />
            )}
            {nextConcept && (
              <Link
                to={`/lliço/${nextConcept.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:underline"
              >
                {nextConcept.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const visibleSections = parsed.sections.filter((sec) => {
    if (viewMode === 'all') return true;
    if (viewMode === 'theory') return ['A', 'B', 'C', 'D', 'E', 'J'].includes(sec.letter);
    if (viewMode === 'practice') return ['F', 'G', 'I'].includes(sec.letter);
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700">
                MÒDUL {concept.module} · CONCEPTE {concept.order}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                ~{concept.estimatedMinutes} min
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                {questions.length} preguntes test · {flashcards.length} flashcards
              </span>
            </div>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {concept.title}
            </h1>
            {concept.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {concept.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleLessonComplete(concept.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isCompleted
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCompleted ? 'Lliçó completada' : 'Marcar completada'}
            </button>
            <button
              type="button"
              onClick={() => toggleExerciseSolved(concept.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isExerciseSolved
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              {isExerciseSolved ? 'Exercici resolt' : 'Marcar exercici resolt'}
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(concept.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isFavorite
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label="Afegir a favorits"
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
              Favorit
            </button>
          </div>
        </div>

        {/* Cross references */}
        {concept.crossReferences.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Referències creuades:</span>
            {concept.crossReferences.map((refId) => {
              const target = getConceptById(refId);
              if (!target) return null;
              return (
                <Link
                  key={refId}
                  to={`/lliço/${refId}`}
                  className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  M{target.module} · {target.title}
                </Link>
              );
            })}
          </div>
        )}

        {/* Section Tabs */}
        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
          {(
            [
              { id: 'all', label: 'Lliçó completa (A–J)' },
              { id: 'theory', label: 'Teoria i resum (A–E, J)' },
              { id: 'practice', label: 'Exemple, exercici i desenvolupament (F, G, I)' },
              { id: 'quiz', label: `Test individual (${questions.length})` },
              { id: 'flashcards', label: `Flashcards (${flashcards.length})` },
              { id: 'notes', label: 'Notes personals' },
            ] as { id: ViewMode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === tab.id
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Lesson Content */}
      {loadingLesson ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Carregant contingut de la lliçó...
        </div>
      ) : (
        <>
          {(viewMode === 'all' || viewMode === 'theory' || viewMode === 'practice') && (
            <div className="space-y-6">
              {visibleSections.map((sec) => (
                <section
                  key={sec.letter}
                  id={`sec-${sec.letter}`}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8"
                >
                  <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-700 text-sm font-bold text-white">
                      {sec.letter}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{sec.heading}</h2>
                  </div>

                  {sec.letter === 'H' ? (
                    <div className="space-y-4">
                      {sec.markdown && <MarkdownRenderer markdown={sec.markdown} />}
                      <QuizRunner
                        questions={questions}
                        config={conceptQuizConfig}
                        onComplete={recordExamAttempt}
                      />
                    </div>
                  ) : sec.letter === 'J' ? (
                    <div className="space-y-6">
                      <MarkdownRenderer markdown={sec.markdown} />
                      {flashcards.length > 0 && (
                        <div className="border-t border-slate-200 pt-6">
                          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                            <Layers className="h-4 w-4 text-indigo-600" />
                            Fitxes de memorització interactives (SM-2)
                          </h3>
                          <FlashcardDeck
                            cards={flashcards}
                            onRate={(cardId, quality) => reviewSrsCard(cardId, 'flashcard', quality)}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <MarkdownRenderer markdown={sec.markdown} />
                  )}
                </section>
              ))}
            </div>
          )}

          {viewMode === 'quiz' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <QuizRunner
                questions={questions}
                config={conceptQuizConfig}
                onComplete={recordExamAttempt}
              />
            </div>
          )}

          {viewMode === 'flashcards' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <FlashcardDeck
                cards={flashcards}
                onRate={(cardId, quality) => reviewSrsCard(cardId, 'flashcard', quality)}
              />
            </div>
          )}

          {viewMode === 'notes' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Notes personals d’estudi
                </h2>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <Bookmark className="h-3.5 w-3.5" />
                  Es desa automàticament
                </span>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => saveNote(concept.id, e.target.value)}
                rows={12}
                placeholder="Anota dubtes, esquemes propis, fórmules o punts clau per recordar el dia de l'examen..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          )}
        </>
      )}

      {/* Prev / Next navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {prevConcept ? (
          <Link
            to={`/lliço/${prevConcept.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              Anterior: M{prevConcept.module} · {prevConcept.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nextConcept && (
          <Link
            to={`/lliço/${nextConcept.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            <span>
              Següent: M{nextConcept.module} · {nextConcept.title}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
};
