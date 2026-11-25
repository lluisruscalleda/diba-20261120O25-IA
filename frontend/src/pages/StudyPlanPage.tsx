import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import type { StudyPlanConfig } from '../types/academy';
import { generateStudySchedule } from '../utils/studyPlan';

const DAY_OPTIONS: StudyPlanConfig['totalDays'][] = [15, 30, 45, 60, 90];

export const StudyPlanPage: React.FC = () => {
  const { manifest, progress, saveStudyPlan, toggleStudyPlanTask } = useAcademy();

  const existing = progress.studyPlan;
  const [totalDays, setTotalDays] = useState<StudyPlanConfig['totalDays']>(existing?.totalDays ?? 45);
  const [hoursPerDay, setHoursPerDay] = useState<number>(existing?.hoursPerDay ?? 2.5);
  const [initialLevel, setInitialLevel] = useState<StudyPlanConfig['initialLevel']>(
    existing?.initialLevel ?? 'intermediate'
  );
  const [startDate, setStartDate] = useState<string>(
    existing?.startDate ?? new Date().toISOString().slice(0, 10)
  );

  const activeConfig: StudyPlanConfig = existing ?? {
    totalDays,
    hoursPerDay,
    initialLevel,
    startDate,
    completedTaskIds: [],
  };

  const schedule = useMemo(() => {
    if (!manifest) return [];
    return generateStudySchedule(manifest.modules, activeConfig);
  }, [manifest, activeConfig]);

  const totalTasks = schedule.reduce((acc, d) => acc + d.tasks.length, 0);
  const completedTasks = activeConfig.completedTaskIds.length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStudyPlan({
      totalDays,
      hoursPerDay,
      initialLevel,
      startDate,
      completedTaskIds: existing?.completedTaskIds ?? [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Calendar className="h-6 w-6 text-indigo-700" />
          Pla d’Estudi Configurable
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Genera un calendari realista de 15, 30, 45, 60 o 90 dies adaptat a les teves hores diàries
          i al teu nivell de partida.
        </p>

        <form onSubmit={handleSave} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Horitzó (dies)</label>
            <select
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value) as StudyPlanConfig['totalDays'])}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} dies
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Hores al dia</label>
            <input
              type="number"
              min={0.5}
              max={10}
              step={0.5}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Nivell inicial</label>
            <select
              value={initialLevel}
              onChange={(e) =>
                setInitialLevel(e.target.value as StudyPlanConfig['initialLevel'])
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="beginner">Inicial (des de zero)</option>
              <option value="intermediate">Intermedi (base tècnica)</option>
              <option value="advanced">Avançat (repàs intensiu)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Data d’inici</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Aplicar pla
            </button>
          </div>
        </form>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
          <span>
            Compliment del pla: <strong>{completionPct}%</strong> ({completedTasks}/{totalTasks} tasques)
          </span>
          <span>
            Càrrega total estimada:{' '}
            <strong>
              {Math.round(schedule.reduce((s, d) => s + d.totalMinutes, 0) / 60)} hores
            </strong>
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {schedule.map((day) => {
          const allDone =
            day.tasks.length > 0 &&
            day.tasks.every((t) => activeConfig.completedTaskIds.includes(t.id));
          return (
            <div
              key={day.day}
              className={`rounded-xl border p-4 shadow-2xs ${
                allDone ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    Dia {day.day} · {day.dateLabel}
                  </span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {day.phase}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  ~{(day.totalMinutes / 60).toFixed(1)} h
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {day.tasks.map((task) => {
                  const checked = activeConfig.completedTaskIds.includes(task.id);
                  return (
                    <li key={task.id} className="flex items-start gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (!existing) {
                            saveStudyPlan({
                              totalDays,
                              hoursPerDay,
                              initialLevel,
                              startDate,
                              completedTaskIds: [task.id],
                            });
                          } else {
                            toggleStudyPlanTask(task.id);
                          }
                        }}
                        className="mt-0.5 shrink-0 text-indigo-600"
                        aria-label="Marcar tasca"
                      >
                        {checked ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 hover:text-indigo-500" />
                        )}
                      </button>
                      <div className="flex-1">
                        {task.conceptId ? (
                          <Link
                            to={`/lliço/${task.conceptId}`}
                            className={`font-medium hover:text-indigo-700 ${
                              checked ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </Link>
                        ) : (
                          <span
                            className={`font-medium ${
                              checked ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </span>
                        )}
                        <span className="ml-1.5 text-slate-400">({task.estimatedMinutes} min)</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
