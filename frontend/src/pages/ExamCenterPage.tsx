import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, ClipboardCheck, History, Play, SlidersHorizontal } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { QuizRunner } from '../components/QuizRunner';
import { selectAdaptiveQuestions, shuffleArray } from '../utils/examEngine';
import type { ExamConfig, PracticalCase, QuizQuestion } from '../types/academy';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const ExamCenterPage: React.FC = () => {
  const { manifest, progress, recordExamAttempt } = useAcademy();
  const [searchParams] = useSearchParams();
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const initialPreset = searchParams.get('preset');
  const initialModule = Number(searchParams.get('module')) || 1;

  const [mode, setMode] = useState<ExamConfig['mode']>(
    initialPreset === 'missed'
      ? 'missed'
      : searchParams.get('module')
        ? 'module'
        : 'global'
  );
  const [selectedModule, setSelectedModule] = useState<number>(initialModule);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [penaltyPerWrong, setPenaltyPerWrong] = useState<number>(0.25);
  const [passThreshold, setPassThreshold] = useState<number>(50);
  const [theoryWeight, setTheoryWeight] = useState<number>(50);
  const [timed, setTimed] = useState<boolean>(true);

  const [activeExam, setActiveExam] = useState<{
    questions: QuizQuestion[];
    config: ExamConfig;
  } | null>(null);

  const [activePractical, setActivePractical] = useState<PracticalCase | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<number, number>>({});
  const [showPracticalSolution, setShowPracticalSolution] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/all-questions.json')
      .then((res) => (res.ok ? res.json() : { questions: [] }))
      .then((data: { questions?: QuizQuestion[] }) => {
        if (!cancelled) {
          setAllQuestions(data.questions ?? []);
          setLoadingQuestions(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingQuestions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const missedIds = useMemo(
    () =>
      new Set(
        Object.values(progress.missedQuestions)
          .filter((m) => m.correctStreak < 2)
          .map((m) => m.questionId)
      ),
    [progress.missedQuestions]
  );

  const startDynamicExam = () => {
    let pool: QuizQuestion[] = [];
    let title = 'Simulacre personalitzat';

    if (mode === 'module') {
      pool = shuffleArray(allQuestions.filter((q) => q.module === selectedModule)).slice(
        0,
        questionCount
      );
      title = `Test acumulatiu · Mòdul ${selectedModule}`;
    } else if (mode === 'missed') {
      pool = shuffleArray(allQuestions.filter((q) => missedIds.has(q.id))).slice(0, questionCount);
      title = 'Test de preguntes fallades';
    } else if (mode === 'adaptive') {
      pool = selectAdaptiveQuestions(
        allQuestions,
        questionCount,
        progress.examAttempts,
        progress.missedQuestions
      );
      title = 'Test adaptatiu (focalitzat en debilitats)';
    } else {
      pool = shuffleArray(allQuestions).slice(0, questionCount);
      title = 'Simulacre global del temari';
    }

    const config: ExamConfig = {
      mode,
      title,
      durationMinutes,
      questionCount: pool.length,
      penaltyPerWrong,
      passThreshold,
      theoryWeight,
      practiceWeight: 100 - theoryWeight,
      moduleId: mode === 'module' ? selectedModule : undefined,
    };

    setActivePractical(null);
    setActiveExam({ questions: pool, config });
  };

  const loadExamFile = async (path: string, title: string, fallbackDuration = 60) => {
    const res = await fetch(path);
    if (!res.ok) return;
    const data = (await res.json()) as { questions?: QuizQuestion[] };
    const qs = data.questions ?? [];
    setActivePractical(null);
    setActiveExam({
      questions: qs,
      config: {
        mode: 'custom-file',
        title,
        durationMinutes: fallbackDuration,
        questionCount: qs.length,
        penaltyPerWrong,
        passThreshold,
        theoryWeight,
        practiceWeight: 100 - theoryWeight,
      },
    });
  };

  const loadPracticalCase = async (path: string) => {
    const res = await fetch(path);
    if (!res.ok) return;
    const data = (await res.json()) as PracticalCase;
    setActiveExam(null);
    setActivePractical(data);
    setRubricScores({});
    setShowPracticalSolution(false);
  };

  const practicalTotalMax = activePractical
    ? activePractical.rubric.reduce((s, r) => s + r.maxPoints, 0)
    : 0;
  const practicalUserTotal = Object.values(rubricScores).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <ClipboardCheck className="h-6 w-6 text-indigo-700" />
              Centre de Simulacres i Mode Examen
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Practica amb tests per mòdul, globals, adaptatius, de preguntes fallades i supòsits
              pràctics cronometrats.
            </p>
          </div>
          {(activeExam || activePractical) && (
            <button
              type="button"
              onClick={() => {
                setActiveExam(null);
                setActivePractical(null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tornar al configurador
            </button>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs text-sky-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
          <p>
            <strong>Avís metodològic:</strong> la durada, el nombre de preguntes, la penalització per
            respostes incorrectes, la nota mínima i la ponderació entre teoria i pràctica són{' '}
            <strong>paràmetres configurables de preparació</strong> i no pressuposen les bases
            oficials d’una convocatòria concreta.
          </p>
        </div>
      </div>

      {/* Active Quiz */}
      {activeExam && (
        <QuizRunner
          questions={activeExam.questions}
          config={activeExam.config}
          timed={timed}
          onComplete={recordExamAttempt}
        />
      )}

      {/* Active Practical Case */}
      {activePractical && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div>
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
              SUPÒSIT PRÀCTIC · Mòduls {activePractical.modules.join(', ')}
            </span>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{activePractical.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{activePractical.context}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-slate-900">Enunciat i requisits</h3>
            <div className="mt-2">
              <MarkdownRenderer markdown={activePractical.statement} />
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {activePractical.requirements.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Self-evaluation rubric */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Rúbrica d’autoavaluació</h3>
              <span className="rounded-full bg-indigo-700 px-3 py-1 text-xs font-bold text-white">
                Puntuació: {practicalUserTotal} / {practicalTotalMax}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {activePractical.rubric.map((item, idx) => (
                <div
                  key={item.criterion}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="max-w-2xl">
                    <p className="text-sm font-semibold text-slate-900">{item.criterion}</p>
                    <p className="text-xs text-slate-600">{item.description}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    Punts (0–{item.maxPoints}):
                    <input
                      type="number"
                      min={0}
                      max={item.maxPoints}
                      step={0.5}
                      value={rubricScores[idx] ?? 0}
                      onChange={(e) =>
                        setRubricScores((prev) => ({
                          ...prev,
                          [idx]: Math.min(item.maxPoints, Math.max(0, Number(e.target.value))),
                        }))
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowPracticalSolution((s) => !s)}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {showPracticalSolution ? 'Ocultar solució de referència' : 'Mostrar solució de referència'}
            </button>
            {showPracticalSolution && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
                <MarkdownRenderer markdown={activePractical.modelSolution} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configurator */}
      {!activeExam && !activePractical && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                Configurador de simulacre a mida
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Banc actiu disponible: {loadingQuestions ? '...' : `${allQuestions.length} preguntes`} ·
                Fallades pendents: {missedIds.size}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Modalitat</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ExamConfig['mode'])}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="global">Global (tot el temari)</option>
                    <option value="module">Acumulatiu per mòdul</option>
                    <option value="adaptive">Adaptatiu (prioritza debilitats)</option>
                    <option value="missed">Només preguntes fallades ({missedIds.size})</option>
                  </select>
                </div>

                {mode === 'module' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Mòdul</label>
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {manifest?.modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          Mòdul {m.id}: {m.shortTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nombre de preguntes
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Durada (minuts)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Penalització per resposta incorrecta
                  </label>
                  <select
                    value={penaltyPerWrong}
                    onChange={(e) => setPenaltyPerWrong(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value={0}>Sense penalització (0)</option>
                    <option value={0.25}>-0,25 punts (4 errors resten 1 encert)</option>
                    <option value={0.33}>-0,33 punts (3 errors resten 1 encert)</option>
                    <option value={0.5}>-0,50 punts (2 errors resten 1 encert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nota mínima d’aprovat (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Ponderació teoria / pràctica: {theoryWeight}% / {100 - theoryWeight}%
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    step={5}
                    value={theoryWeight}
                    onChange={(e) => setTheoryWeight(Number(e.target.value))}
                    className="mt-2 w-full accent-indigo-600"
                  />
                </div>

                <label className="flex items-center gap-2 pt-5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={timed}
                    onChange={(e) => setTimed(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600"
                  />
                  Activar compte enrere cronometrat
                </label>
              </div>

              <button
                type="button"
                disabled={allQuestions.length === 0}
                onClick={startDynamicExam}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                Iniciar simulacre
              </button>
            </div>

            {/* Structured exams catalog */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Exàmens oficials del curs i supòsits pràctics
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-indigo-700">
                    Exàmens de mòdul ({manifest?.exams.moduleExams.length ?? 0}/8)
                  </p>
                  {manifest?.exams.moduleExams.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {manifest.exams.moduleExams.map((ex) => (
                        <li key={ex.id}>
                          <button
                            type="button"
                            onClick={() => void loadExamFile(ex.path, ex.title, 45)}
                            className="text-left text-xs font-medium text-indigo-700 hover:underline"
                          >
                            {ex.title} ({ex.questionCount} preg.)
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Es generaran a la Fase 5 (mentrestant usa el configurador dinàmic de dalt).
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-indigo-700">
                    Simulacres globals ({manifest?.exams.globalMocks.length ?? 0}/10)
                  </p>
                  {manifest?.exams.globalMocks.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {manifest.exams.globalMocks.map((ex) => (
                        <li key={ex.id}>
                          <button
                            type="button"
                            onClick={() => void loadExamFile(ex.path, ex.title, 60)}
                            className="text-left text-xs font-medium text-indigo-700 hover:underline"
                          >
                            {ex.title} ({ex.questionCount} preg.)
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Disponibles a la Fase 5 un cop completat el banc de preguntes dels 8 mòduls.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-indigo-700">
                    Supòsits pràctics ({manifest?.exams.practicalCases.length ?? 0}/20)
                  </p>
                  {manifest?.exams.practicalCases.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {manifest.exams.practicalCases.map((pc) => (
                        <li key={pc.id}>
                          <button
                            type="button"
                            onClick={() => void loadPracticalCase(pc.path)}
                            className="text-left text-xs font-medium text-indigo-700 hover:underline"
                          >
                            {pc.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Disponibles a la Fase 5 (amb rúbrica d’autoavaluació interactiva).
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-indigo-700">
                    Simulacres complets ({manifest?.exams.fullSimulations.length ?? 0}/5)
                  </p>
                  {manifest?.exams.fullSimulations.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {manifest.exams.fullSimulations.map((sim) => (
                        <li key={sim.id}>
                          <button
                            type="button"
                            onClick={() => void loadExamFile(sim.path, sim.title, 90)}
                            className="text-left text-xs font-medium text-indigo-700 hover:underline"
                          >
                            {sim.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Disponibles a la Fase 5 integrant test cronometrat + supòsit pràctic.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attempt History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <History className="h-4 w-4 text-indigo-600" />
              Historial d’intents ({progress.examAttempts.length})
            </h2>
            {progress.examAttempts.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">Encara no has registrat cap intent.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 max-h-[32rem] overflow-y-auto">
                {progress.examAttempts.slice(0, 20).map((att) => (
                  <li
                    key={att.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{att.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          att.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.penalizedScorePercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {new Date(att.date).toLocaleDateString('ca-ES')} · {att.correctCount}✓ /{' '}
                      {att.wrongCount}✗ / {att.blankCount} en blanc
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
