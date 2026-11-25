#!/usr/bin/env node
/**
 * Sincronitza el contingut educatiu (content/, question-bank/, flashcards/, exams/, docs/)
 * cap a frontend/public/data/ i genera manifest.json i search-index.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'frontend', 'public', 'data');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: markdown };
  const raw = match[1];
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }
    } else if (/^\d+$/.test(val)) {
      data[key] = Number(val);
    } else {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: markdown.slice(match[0].length).trim() };
}

function extractExcerpt(markdown) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/:::[a-z-]+[^\n]*/g, ' ')
    .replace(/:::/g, ' ')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 260);
}

function copyJsonDir(srcDir, destDir) {
  const items = [];
  if (!fs.existsSync(srcDir)) return items;
  ensureDir(destDir);
  for (const file of fs.readdirSync(srcDir).sort()) {
    if (!file.endsWith('.json')) continue;
    const srcPath = path.join(srcDir, file);
    const data = readJson(srcPath);
    fs.copyFileSync(srcPath, path.join(destDir, file));
    items.push({ file, data });
  }
  return items;
}

function main() {
  const syllabusPath = path.join(ROOT, 'content', 'syllabus.json');
  const syllabus = readJson(syllabusPath);

  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  ensureDir(OUT_DIR);

  const searchIndex = [];
  const allQuestionsMeta = [];
  let totalLessonsReady = 0;
  let totalQuestions = 0;
  let totalFlashcards = 0;

  const modules = syllabus.modules.map((mod) => {
    const concepts = mod.concepts.map((concept) => {
      const lessonRel = path.join('content', mod.slug, `${concept.id}.md`);
      const lessonAbs = path.join(ROOT, lessonRel);
      const qbRel = path.join('question-bank', mod.slug, `${concept.id}.json`);
      const qbAbs = path.join(ROOT, qbRel);
      const fcRel = path.join('flashcards', mod.slug, `${concept.id}.json`);
      const fcAbs = path.join(ROOT, fcRel);

      let hasLesson = false;
      let tags = [];
      let crossReferences = [];
      let estimatedMinutes = concept.estimatedMinutes;
      let difficulty = concept.difficulty;

      if (fs.existsSync(lessonAbs)) {
        hasLesson = true;
        totalLessonsReady += 1;
        const rawMd = fs.readFileSync(lessonAbs, 'utf8');
        const { data, body } = parseFrontmatter(rawMd);
        if (Array.isArray(data.tags)) tags = data.tags;
        if (Array.isArray(data.crossReferences)) crossReferences = data.crossReferences;
        if (typeof data.estimatedMinutes === 'number') estimatedMinutes = data.estimatedMinutes;
        if (typeof data.difficulty === 'string') difficulty = data.difficulty;

        const outLessonDir = path.join(OUT_DIR, 'lessons', mod.slug);
        ensureDir(outLessonDir);
        fs.writeFileSync(path.join(outLessonDir, `${concept.id}.md`), rawMd, 'utf8');

        searchIndex.push({
          type: 'lesson',
          id: concept.id,
          module: mod.id,
          moduleTitle: mod.shortTitle,
          title: concept.title,
          tags,
          excerpt: extractExcerpt(body),
          url: `/lliço/${concept.id}`,
        });
      }

      let questionCount = 0;
      if (fs.existsSync(qbAbs)) {
        const qb = readJson(qbAbs);
        const questions = Array.isArray(qb.questions) ? qb.questions : [];
        questionCount = questions.length;
        totalQuestions += questionCount;
        const outQbDir = path.join(OUT_DIR, 'question-bank', mod.slug);
        ensureDir(outQbDir);
        fs.writeFileSync(path.join(outQbDir, `${concept.id}.json`), JSON.stringify(qb), 'utf8');
        for (const q of questions) {
          allQuestionsMeta.push(q);
        }
      }

      let flashcardCount = 0;
      if (fs.existsSync(fcAbs)) {
        const fc = readJson(fcAbs);
        const cards = Array.isArray(fc.cards) ? fc.cards : [];
        flashcardCount = cards.length;
        totalFlashcards += flashcardCount;
        const outFcDir = path.join(OUT_DIR, 'flashcards', mod.slug);
        ensureDir(outFcDir);
        fs.writeFileSync(path.join(outFcDir, `${concept.id}.json`), JSON.stringify(fc), 'utf8');
      }

      return {
        ...concept,
        module: mod.id,
        moduleSlug: mod.slug,
        estimatedMinutes,
        difficulty,
        tags,
        crossReferences,
        hasLesson,
        questionCount,
        flashcardCount,
        lessonPath: hasLesson ? `/data/lessons/${mod.slug}/${concept.id}.md` : null,
        questionBankPath: questionCount > 0 ? `/data/question-bank/${mod.slug}/${concept.id}.json` : null,
        flashcardsPath: flashcardCount > 0 ? `/data/flashcards/${mod.slug}/${concept.id}.json` : null,
      };
    });

    return {
      ...mod,
      concepts,
      readyLessons: concepts.filter((c) => c.hasLesson).length,
      totalConcepts: concepts.length,
    };
  });

  // Aggregate all concept questions for fast exam generation (adaptive / global / missed / module)
  fs.writeFileSync(
    path.join(OUT_DIR, 'all-questions.json'),
    JSON.stringify({ questions: allQuestionsMeta }),
    'utf8'
  );

  // Aggregate all flashcards for SM-2 review
  const allFlashcards = [];
  for (const mod of modules) {
    for (const c of mod.concepts) {
      if (c.flashcardCount > 0) {
        const fc = readJson(path.join(ROOT, 'flashcards', mod.slug, `${c.id}.json`));
        if (Array.isArray(fc.cards)) allFlashcards.push(...fc.cards);
      }
    }
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'all-flashcards.json'),
    JSON.stringify({ cards: allFlashcards }),
    'utf8'
  );

  // Exams & Practical cases
  const moduleExams = copyJsonDir(
    path.join(ROOT, 'exams', 'module-exams'),
    path.join(OUT_DIR, 'exams', 'module-exams')
  ).map(({ file, data }) => ({
    id: data.id || file.replace('.json', ''),
    title: data.title,
    module: data.module,
    questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
    path: `/data/exams/module-exams/${file}`,
  }));

  const globalMocks = copyJsonDir(
    path.join(ROOT, 'exams', 'global-mocks'),
    path.join(OUT_DIR, 'exams', 'global-mocks')
  ).map(({ file, data }) => ({
    id: data.id || file.replace('.json', ''),
    title: data.title,
    questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
    path: `/data/exams/global-mocks/${file}`,
  }));

  const practicalCases = copyJsonDir(
    path.join(ROOT, 'exams', 'practical-cases'),
    path.join(OUT_DIR, 'exams', 'practical-cases')
  ).map(({ file, data }) => ({
    id: data.id || file.replace('.json', ''),
    title: data.title,
    modules: data.modules || [],
    difficulty: data.difficulty || 'intermediate',
    path: `/data/exams/practical-cases/${file}`,
  }));

  const fullSimulations = copyJsonDir(
    path.join(ROOT, 'exams', 'full-simulations'),
    path.join(OUT_DIR, 'exams', 'full-simulations')
  ).map(({ file, data }) => ({
    id: data.id || file.replace('.json', ''),
    title: data.title,
    questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
    path: `/data/exams/full-simulations/${file}`,
  }));

  // Glossary
  const glossarySrc = path.join(ROOT, 'docs', 'glossary.json');
  let glossaryCount = 0;
  if (fs.existsSync(glossarySrc)) {
    const glossary = readJson(glossarySrc);
    glossaryCount = Array.isArray(glossary.terms) ? glossary.terms.length : 0;
    fs.writeFileSync(path.join(OUT_DIR, 'glossary.json'), JSON.stringify(glossary), 'utf8');
    for (const term of glossary.terms || []) {
      searchIndex.push({
        type: 'glossary',
        id: term.id,
        module: term.module,
        moduleTitle: `Mòdul ${term.module}`,
        title: `${term.term} (${term.english})`,
        tags: ['glossari', term.english],
        excerpt: term.definition,
        url: `/glossari?q=${encodeURIComponent(term.term)}`,
      });
    }
  }

  // Labs availability
  const labs = syllabus.labs.map((lab) => {
    const absLabPath = path.join(ROOT, lab.path);
    const readmePath = path.join(absLabPath, 'README.md');
    const available = fs.existsSync(readmePath);
    if (available) {
      const outLabDir = path.join(OUT_DIR, 'labs');
      ensureDir(outLabDir);
      fs.copyFileSync(readmePath, path.join(outLabDir, `${lab.id}.md`));
    }
    return {
      ...lab,
      available,
      readmePath: available ? `/data/labs/${lab.id}.md` : null,
    };
  });

  // Final project availability
  const finalProjectReadme = path.join(ROOT, 'final-project', 'README.md');
  const finalProjectAvailable = fs.existsSync(finalProjectReadme);
  if (finalProjectAvailable) {
    fs.copyFileSync(finalProjectReadme, path.join(OUT_DIR, 'final-project.md'));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    title: syllabus.title,
    institution: syllabus.institution,
    stats: {
      totalModules: modules.length,
      totalConcepts: modules.reduce((acc, m) => acc + m.totalConcepts, 0),
      readyLessons: totalLessonsReady,
      totalQuestions,
      totalFlashcards,
      glossaryCount,
      moduleExamsCount: moduleExams.length,
      globalMocksCount: globalMocks.length,
      practicalCasesCount: practicalCases.length,
      fullSimulationsCount: fullSimulations.length,
      labsReady: labs.filter((l) => l.available).length,
      finalProjectAvailable,
    },
    modules,
    labs,
    exams: {
      moduleExams,
      globalMocks,
      practicalCases,
      fullSimulations,
    },
    finalProject: {
      title: "Sistema intel·ligent de gestió d'expedients administratius",
      available: finalProjectAvailable,
      readmePath: finalProjectAvailable ? '/data/final-project.md' : null,
    },
  };

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'search-index.json'), JSON.stringify(searchIndex), 'utf8');

  console.log(
    `[sync_content] OK — Lliçons: ${totalLessonsReady}/${manifest.stats.totalConcepts} | Preguntes: ${totalQuestions} | Flashcards: ${totalFlashcards} | Glossari: ${glossaryCount}`
  );
}

main();
