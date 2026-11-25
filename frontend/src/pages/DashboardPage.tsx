import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookCheck,
  CheckSquare,
  Download,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAcademy } from '../context/AcademyContext';
import { computeConceptMastery } from '../utils/examEngine';

export const DashboardPage: React.FC = () => {
  const {
    manifest,
    allConcepts,
    progress,
    exportProgressJson,
    importProgressJson,
  } = useAcademy();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const completedCount = Object.keys(progress.completedLessons).length;
  const solvedCount = Object.keys(progress.solvedExercises).length;
  const totalConcepts = allConcepts.length || 70;
  const globalPercent = Math.round((completedCount / totalConcepts) * 100);

  const avgScore = useMemo(() => {
    if (progress.examAttempts.length === 0) return null;
    const sum = progress.examAttempts.reduce((acc, a) => acc + a.penalizedScorePercent, 0);
    return Number((sum / progress.examAttempts.length).toFixed(1));
  }, [progress.examAttempts]);

  const moduleProgressData = useMemo(() => {
    if (!manifest) return [];
    return manifest.modules.map((m) => {
      const done = m.concepts.filter((c) => Boolean(progress.completedLessons[c.id])).length;
      const pct = Math.round((done / Math.max(m.totalConcepts, 1)) * 100);
      return {
        name: `M${m.id}`,
        fullTitle: m.title,
        percent: pct,
        completed: done,
        total: m.totalConcepts,
      };
    });
  }, [manifest, progress.completedLessons]);

  const scoreEvolutionData = useMemo(() => {
    return [...progress.examAttempts]
      .reverse()
      .slice(-15)
      .map((a, idx) => ({
        name: `#${idx + 1}`,
        nota: a.penalizedScorePercent,
        bruta: a.rawScorePercent,
        title: a.title,
      }));
  }, [progress.examAttempts]);

  const mastery = useMemo(
    () => computeConceptMastery(progress.examAttempts, progress.missedQuestions),
    [progress.examAttempts, progress.missedQuestions]
  );

  const masteredConcepts = useMemo(
    () =>
      allConcepts.filter((c) => {
        const m = mastery[c.id];
        return Boolean(progress.completedLessons[c.id]) && m && m.attempts >= 5 && m.accuracy >= 80;
      }),
    [allConcepts, mastery, progress.completedLessons]
  );

  const weakConcepts = useMemo(
    () =>
      allConcepts
        .filter((c) => {
          const m = mastery[c.id];
          return m && m.attempts > 0 && (m.accuracy < 70 || m.missedCount >= 2);
        })
        .sort((a, b) => (mastery[a.id]?.accuracy ?? 0) - (mastery[b.id]?.accuracy ?? 0))
        .slice(0, 6),
    [allConcepts, mastery]
  );

  const recommendations = useMemo(() => {
    const recs: { title: string; reason: string; to: string; cta: string }[] = [];
    if (weakConcepts.length > 0) {
      const topWeak = weakConcepts[0];
      recs.push({
        title: `Reforça: ${topWeak.title}`,
        reason: `Precisió històrica del ${mastery[topWeak.id]?.accuracy ?? 0}% en tests. Repassa la lliçó i les preguntes fallades.`,
        to: `/lliço/${topWeak.id}`,
        cta: 'Obrir lliçó',
      });
    }
    const nextUnreadReady = allConcepts.find(
      (c) => c.hasLesson && !progress.completedLessons[c.id]
    );
    if (nextUnreadReady) {
      recs.push({
        title: `Següent lliçó recomanada: ${nextUnreadReady.title}`,
        reason: `Mòdul ${nextUnreadReady.module} · Temps estimat: ${nextUnreadReady.estimatedMinutes} min.`,
        to: `/lliço/${nextUnreadReady.id}`,
        cta: 'Començar lliçó',
      });
    }
    const activeMissed = Object.values(progress.missedQuestions).filter((q) => q.correctStreak < 2);
    if (activeMissed.length >= 3) {
      recs.push({
        title: `Tens ${activeMissed.length} preguntes fallades pendents de consolidar`,
        reason: 'Fes un test focalitzat en errors recents per eliminar llacunes abans dels simulacres.',
        to: '/examens?preset=missed',
        cta: 'Practicar errors',
      });
    }
    if (!progress.studyPlan) {
      recs.push({
        title: "Configura el teu pla d'estudi personalitzat",
        reason: 'Tria entre 15, 30, 45, 60 o 90 dies segons la disponibilitat i el nivell inicial.',
        to: '/pla-estudi',
        cta: 'Crear pla',
      });
    }
    return recs;
  }, [weakConcepts, mastery, allConcepts, progress]);

  const handleExport = () => {
    const blob = new Blob([exportProgressJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progres-academia-ia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importProgressJson(String(reader.result ?? ''));
      setImportStatus(
        ok ? 'Progrés importat correctament.' : 'Fitxer JSON no vàlid.'
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-indigo-500/25 px-3 py-1 text-xs font-semibold text-indigo-200">
              Preparació prova teoricopràctica · Diputació de Barcelona
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Acadèmia d’Intel·ligència Artificial per a l’Administració Pública
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Curs exhaustiu dels 8 mòduls oficials (70 conceptes), laboratoris executables en Python,
              banc de tests amb justificació de cada distractor, repetició espaiada SM-2 i projecte
              integrador d’expedients administratius.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar progrés
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
            >
              <Upload className="h-3.5 w-3.5" />
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>
        {importStatus && (
          <p className="mt-3 text-xs font-medium text-emerald-300">{importStatus}</p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progrés global
            </span>
            <Target className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{globalPercent}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${globalPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {completedCount} de {totalConcepts} conceptes completats
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Exercicis resolts
            </span>
            <CheckSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{solvedCount}</p>
          <p className="mt-2 text-xs text-slate-500">
            de {totalConcepts} exercicis independents (Apartat G)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nota mitjana tests
            </span>
            <TrendingUp className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {progress.examAttempts.length} intents registrats
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Conceptes dominats
            </span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{masteredConcepts.length}</p>
          <p className="mt-2 text-xs text-slate-500">
            Lliçó completada + ≥80% en tests (mín. 5 preguntes)
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">Recomanacions personalitzades d’estudi</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recommendations.map((rec) => (
            <Link
              key={rec.title}
              to={rec.to}
              className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-800">
                  {rec.title}
                </p>
                <p className="mt-1 text-xs text-slate-600">{rec.reason}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs">
                {rec.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900">Progrés per mòdul (%)</h2>
          <p className="text-xs text-slate-500">Percentatge de lliçons completades a cada mòdul oficial</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Completat']}
                  labelFormatter={(label) => {
                    const found = moduleProgressData.find((d) => d.name === label);
                    return found ? `${found.name}: ${found.fullTitle}` : String(label);
                  }}
                />
                <Bar dataKey="percent" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900">Evolució de les notes dels tests</h2>
          <p className="text-xs text-slate-500">Últims 15 intents (nota amb penalització vs nota bruta)</p>
          <div className="mt-4 h-64">
            {scoreEvolutionData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
                Completa el primer test per visualitzar l’evolució de les teves notes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="nota" name="Amb penalització %" stroke="#4f46e5" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="bruta" name="Bruta %" stroke="#94a3b8" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Mastered vs Needs Reinforcement */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <BookCheck className="h-5 w-5 text-emerald-600" />
            Conceptes dominats ({masteredConcepts.length})
          </h2>
          {masteredConcepts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Marca lliçons com a completades i obté ≥80% als tests per consolidar el domini.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {masteredConcepts.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/lliço/${c.id}`}
                    className="flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2 text-sm text-emerald-950 hover:bg-emerald-100/70"
                  >
                    <span>
                      M{c.module} · {c.title}
                    </span>
                    <span className="font-semibold">{mastery[c.id]?.accuracy}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Conceptes pendents de reforçar ({weakConcepts.length})
          </h2>
          {weakConcepts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Cap concepte marcat com a feble encara. Quan facis tests, aquí apareixeran els punts amb
              menor precisió.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {weakConcepts.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/lliço/${c.id}`}
                    className="flex items-center justify-between rounded-lg bg-amber-50/70 px-3 py-2 text-sm text-amber-950 hover:bg-amber-100/80"
                  >
                    <span>
                      M{c.module} · {c.title}
                    </span>
                    <span className="font-semibold">{mastery[c.id]?.accuracy ?? 0}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modules overview cards */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Mapa dels 8 mòduls oficials</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {manifest?.modules.map((mod) => {
            const firstConcept = mod.concepts[0];
            const completed = mod.concepts.filter((c) => Boolean(progress.completedLessons[c.id])).length;
            return (
              <div
                key={mod.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                      MÒDUL {mod.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Disponibles: {mod.readyLessons}/{mod.totalConcepts} · Completats: {completed}/{mod.totalConcepts}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900">{mod.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{mod.description}</p>
                </div>
                {firstConcept && (
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <Link
                      to={`/lliço/${firstConcept.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Obrir mòdul
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to={`/examens?module=${mod.id}`}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Test del mòdul →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
