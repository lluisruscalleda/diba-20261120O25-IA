import type { ModuleMeta, StudyPlanConfig } from '../types/academy';

export interface StudyPlanTask {
  id: string;
  day: number;
  dateLabel: string;
  kind: 'lesson' | 'lab' | 'review' | 'mock';
  title: string;
  moduleId?: number;
  conceptId?: string;
  estimatedMinutes: number;
}

export interface GeneratedStudyDay {
  day: number;
  dateLabel: string;
  phase: 'Fonaments' | 'Aprofundiment' | 'Pràctica i laboratoris' | 'Simulacres i repàs final';
  tasks: StudyPlanTask[];
  totalMinutes: number;
}

function addDaysIso(startIso: string, daysToAdd: number): string {
  const base = new Date(`${startIso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return `Dia ${daysToAdd + 1}`;
  const d = new Date(base.getTime() + daysToAdd * 86400000);
  return d.toLocaleDateString('ca-ES', { weekday: 'short', day: '2-digit', month: 'short' });
}

export function generateStudySchedule(
  modules: ModuleMeta[],
  config: StudyPlanConfig
): GeneratedStudyDay[] {
  const totalDays = config.totalDays;
  const levelMultiplier =
    config.initialLevel === 'beginner' ? 1.15 : config.initialLevel === 'advanced' ? 0.8 : 1.0;

  // Reserve last ~15% of days for intensive mocks & review
  const reviewDaysCount = Math.max(2, Math.round(totalDays * 0.16));
  const coreDaysCount = Math.max(1, totalDays - reviewDaysCount);

  const flatConcepts = modules.flatMap((m) =>
    m.concepts.map((c) => ({
      moduleId: m.id,
      moduleShort: m.shortTitle,
      conceptId: c.id,
      title: c.title,
      minutes: Math.round(c.estimatedMinutes * levelMultiplier),
    }))
  );

  const days: GeneratedStudyDay[] = Array.from({ length: totalDays }, (_, idx) => {
    const dayNum = idx + 1;
    let phase: GeneratedStudyDay['phase'] = 'Fonaments';
    if (dayNum > coreDaysCount) {
      phase = 'Simulacres i repàs final';
    } else if (dayNum > Math.round(coreDaysCount * 0.65)) {
      phase = 'Pràctica i laboratoris';
    } else if (dayNum > Math.round(coreDaysCount * 0.3)) {
      phase = 'Aprofundiment';
    }
    return {
      day: dayNum,
      dateLabel: addDaysIso(config.startDate, idx),
      phase,
      tasks: [],
      totalMinutes: 0,
    };
  });

  // Distribute all 70 concepts evenly across coreDaysCount
  flatConcepts.forEach((item, index) => {
    const targetDayIdx = Math.min(
      coreDaysCount - 1,
      Math.floor((index * coreDaysCount) / flatConcepts.length)
    );
    const task: StudyPlanTask = {
      id: `lesson-${item.conceptId}`,
      day: targetDayIdx + 1,
      dateLabel: days[targetDayIdx].dateLabel,
      kind: 'lesson',
      title: `M${item.moduleId} · ${item.title}`,
      moduleId: item.moduleId,
      conceptId: item.conceptId,
      estimatedMinutes: item.minutes,
    };
    days[targetDayIdx].tasks.push(task);
    days[targetDayIdx].totalMinutes += task.estimatedMinutes;
  });

  // Add module labs & module exams at the end of each module's last day
  for (const mod of modules) {
    const lastConcept = mod.concepts[mod.concepts.length - 1];
    if (!lastConcept) continue;
    const foundDay = days.find((d) => d.tasks.some((t) => t.conceptId === lastConcept.id));
    if (foundDay) {
      const labTask: StudyPlanTask = {
        id: `lab-m${mod.id}`,
        day: foundDay.day,
        dateLabel: foundDay.dateLabel,
        kind: 'lab',
        title: `Laboratori ${mod.id} + Test acumulatiu Mòdul ${mod.id}`,
        moduleId: mod.id,
        estimatedMinutes: Math.round(60 * levelMultiplier),
      };
      foundDay.tasks.push(labTask);
      foundDay.totalMinutes += labTask.estimatedMinutes;
    }
  }

  // Populate final review & mock exam days
  for (let idx = coreDaysCount; idx < totalDays; idx += 1) {
    const offset = idx - coreDaysCount + 1;
    const dayObj = days[idx];
    const mockTask: StudyPlanTask = {
      id: `final-mock-${offset}`,
      day: dayObj.day,
      dateLabel: dayObj.dateLabel,
      kind: 'mock',
      title:
        offset === reviewDaysCount
          ? 'Simulacre teoricopràctic complet i revisió del Projecte Final'
          : `Simulacre global cronometrat #${offset} + Supòsit pràctic`,
      estimatedMinutes: Math.min(Math.round(config.hoursPerDay * 60 * 0.65), 120),
    };
    const reviewTask: StudyPlanTask = {
      id: `final-review-${offset}`,
      day: dayObj.day,
      dateLabel: dayObj.dateLabel,
      kind: 'review',
      title: 'Repàs SM-2 de flashcards i test de preguntes fallades',
      estimatedMinutes: Math.min(Math.round(config.hoursPerDay * 60 * 0.35), 60),
    };
    dayObj.tasks.push(mockTask, reviewTask);
    dayObj.totalMinutes += mockTask.estimatedMinutes + reviewTask.estimatedMinutes;
  }

  return days;
}
