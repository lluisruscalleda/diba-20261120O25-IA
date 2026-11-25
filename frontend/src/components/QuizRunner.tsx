import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Flag,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import type { ExamAttempt, ExamConfig, OptionKey, QuizQuestion } from '../types/academy';
import { evaluateExam } from '../utils/examEngine';

interface QuizRunnerProps {
  questions: QuizQuestion[];
  config: ExamConfig;
  timed?: boolean;
  onComplete?: (attempt: ExamAttempt) => void;
  onRestart?: () => void;
}

const DIFFICULTY_BADGE: Record<QuizQuestion['difficulty'], { label: string; cls: string }> = {
  basic: { label: 'Bàsic', cls: 'bg-emerald-100 text-emerald-800' },
  intermediate: { label: 'Intermedi', cls: 'bg-amber-100 text-amber-800' },
  advanced: { label: 'Avançat', cls: 'bg-rose-100 text-rose-800' },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  questions,
  config,
  timed = false,
  onComplete,
  onRestart,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, OptionKey | null>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const totalSecondsLimit = config.durationMinutes * 60;

  useEffect(() => {
    setCurrentIdx(0);
    setSelected({});
    setFlagged({});
    setSubmitted(false);
    setElapsedSeconds(0);
  }, [questions, config.title]);

  const handleSubmit = () => {
    if (submitted) return;
    const summary = evaluateExam(questions, selected, config);
    setSubmitted(true);
    const attempt: ExamAttempt = {
      id: `att-${Date.now()}`,
      date: new Date().toISOString(),
      mode: config.mode,
      title: config.title,
      totalQuestions: questions.length,
      correctCount: summary.correctCount,
      wrongCount: summary.wrongCount,
      blankCount: summary.blankCount,
      rawScorePercent: summary.rawScorePercent,
      penalizedScorePercent: summary.penalizedScorePercent,
      passed: summary.passed,
      durationSeconds: elapsedSeconds,
      config,
      answers: summary.answers,
    };
    onComplete?.(attempt);
  };

  useEffect(() => {
    if (submitted) return undefined;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (timed && totalSecondsLimit > 0 && next >= totalSecondsLimit) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [submitted, timed, totalSecondsLimit]);

  useEffect(() => {
    if (timed && !submitted && totalSecondsLimit > 0 && elapsedSeconds >= totalSecondsLimit) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, timed, submitted, totalSecondsLimit]);

  const summary = useMemo(
    () => (submitted ? evaluateExam(questions, selected, config) : null),
    [submitted, questions, selected, config]
  );

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        Encara no hi ha preguntes disponibles per a aquesta selecció.
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.values(selected).filter((v) => v !== null).length;
  const remainingSeconds = Math.max(0, totalSecondsLimit - elapsedSeconds);

  const selectOption = (qId: string, key: OptionKey) => {
    if (submitted) return;
    setSelected((prev) => ({
      ...prev,
      [qId]: prev[qId] === key ? null : key,
    }));
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelected({});
    setFlagged({});
    setSubmitted(false);
    setElapsedSeconds(0);
    onRestart?.();
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h3 className="font-semibold text-slate-900">{config.title}</h3>
          <p className="text-xs text-slate-500">
            Respostes: {answeredCount}/{questions.length} · Penalització per error:{' '}
            {config.penaltyPerWrong > 0 ? `-${config.penaltyPerWrong} pt` : 'Sense penalització'} ·
            Llindar d’aprovat: {config.passThreshold}%
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-medium ${
              timed && remainingSeconds < 120
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Clock className="h-4 w-4" />
            {timed ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}
          </div>
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Corregir test
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Repetir
            </button>
          )}
        </div>
      </div>

      {/* Results Banner */}
      {submitted && summary && (
        <div
          className={`rounded-xl border p-5 ${
            summary.passed
              ? 'border-emerald-200 bg-emerald-50/70'
              : 'border-rose-200 bg-rose-50/70'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {summary.passed ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-rose-600" />
              )}
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Nota amb penalització: {summary.penalizedScorePercent}%{' '}
                  <span className="text-sm font-normal text-slate-600">
                    (sense penalització: {summary.rawScorePercent}%)
                  </span>
                </p>
                <p className="text-sm text-slate-700">
                  {summary.passed
                    ? 'Apte segons els paràmetres configurats de preparació.'
                    : 'Per sota del llindar configurat. Revisa les explicacions detallades i les preguntes fallades.'}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <span className="text-emerald-700">Encerts: {summary.correctCount}</span>
              <span className="text-rose-700">Errors: {summary.wrongCount}</span>
              <span className="text-slate-600">En blanc: {summary.blankCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Question Navigator Grid */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-3">
        {questions.map((q, idx) => {
          const ans = selected[q.id];
          const isCurrent = idx === currentIdx;
          const isFlagged = Boolean(flagged[q.id]);
          let btnCls = 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
          if (submitted) {
            if (ans === q.correctOption) {
              btnCls = 'border-emerald-300 bg-emerald-100 text-emerald-900';
            } else if (ans === null || ans === undefined) {
              btnCls = 'border-slate-300 bg-slate-100 text-slate-600';
            } else {
              btnCls = 'border-rose-300 bg-rose-100 text-rose-900';
            }
          } else if (ans) {
            btnCls = 'border-indigo-300 bg-indigo-100 text-indigo-900';
          }
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`relative h-8 w-9 rounded-md border text-xs font-semibold transition ${btnCls} ${
                isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
              }`}
              title={`Pregunta ${idx + 1}`}
            >
              {idx + 1}
              {isFlagged && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pregunta {currentIdx + 1} de {questions.length}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_BADGE[currentQuestion.difficulty].cls}`}
            >
              {DIFFICULTY_BADGE[currentQuestion.difficulty].label}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              Mòdul {currentQuestion.module}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleFlag(currentQuestion.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              flagged[currentQuestion.id]
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            {flagged[currentQuestion.id] ? 'Marcada per revisar' : 'Marcar'}
          </button>
        </div>

        <p className="text-base font-medium leading-relaxed text-slate-900">
          {currentQuestion.prompt}
        </p>

        {currentQuestion.codeSnippet && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
            <code>{currentQuestion.codeSnippet}</code>
          </pre>
        )}

        <div className="mt-5 space-y-2.5">
          {currentQuestion.options.map((opt) => {
            const isChosen = selected[currentQuestion.id] === opt.key;
            const isRight = opt.key === currentQuestion.correctOption;

            let optionCls = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30';
            if (submitted) {
              if (isRight) {
                optionCls = 'border-emerald-400 bg-emerald-50/80';
              } else if (isChosen && !isRight) {
                optionCls = 'border-rose-400 bg-rose-50/80';
              } else {
                optionCls = 'border-slate-200 bg-slate-50/60 opacity-85';
              }
            } else if (isChosen) {
              optionCls = 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600';
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={submitted}
                onClick={() => selectOption(currentQuestion.id, opt.key)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${optionCls}`}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-800">
                  {opt.key}
                </span>
                <span className="flex-1 text-sm text-slate-800">{opt.text}</span>
                {submitted && isRight && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                {submitted && isChosen && !isRight && <XCircle className="h-5 w-5 shrink-0 text-rose-600" />}
              </button>
            );
          })}
        </div>

        {/* Detailed post-submission explanations */}
        {submitted && (
          <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div>
              <p className="font-semibold text-emerald-800">
                Resposta correcta ({currentQuestion.correctOption}):
              </p>
              <p className="mt-1 text-slate-700">{currentQuestion.explanationCorrect}</p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="font-semibold text-slate-800">Per què les altres opcions són incorrectes:</p>
              <ul className="mt-1.5 space-y-1.5 text-slate-700">
                {(['A', 'B', 'C', 'D'] as OptionKey[])
                  .filter((k) => k !== currentQuestion.correctOption)
                  .map((k) => (
                    <li key={k}>
                      <span className="font-semibold text-rose-700">{k}:</span>{' '}
                      {currentQuestion.explanationsIncorrect[k] ?? 'Opció incorrecta.'}
                    </li>
                  ))}
              </ul>
            </div>
            <p className="text-xs text-slate-500">Referència: {currentQuestion.lessonRef}</p>
          </div>
        )}

        {/* Prev / Next */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
          >
            Següent
          </button>
        </div>
      </div>
    </div>
  );
};
