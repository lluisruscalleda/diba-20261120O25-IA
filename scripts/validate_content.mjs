#!/usr/bin/env node
/**
 * Valida rigorosament totes les lliçons Markdown, bancs de preguntes JSON i flashcards JSON.
 * Comprova: apartats obligatoris A-J, blocs interactius, esquema de preguntes,
 * distribució de dificultats, respostes correctes, explicacions de distractors i duplicats.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const REQUIRED_SECTIONS = [
  '## A.',
  '## B.',
  '## C.',
  '## D.',
  '## E.',
  '## F.',
  '## G.',
  '## H.',
  '## I.',
  '## J.',
];

const VALID_DIFFICULTIES = new Set(['basic', 'intermediate', 'advanced']);
const VALID_KEYS = ['A', 'B', 'C', 'D'];

const errors = [];
const warnings = [];

function normalizePrompt(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function main() {
  const syllabus = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'syllabus.json'), 'utf8'));
  const seenQuestionIds = new Set();
  const seenPrompts = new Map();
  const seenCardIds = new Set();

  let validatedLessons = 0;
  let validatedQuestionBanks = 0;
  let validatedQuestions = 0;
  let validatedFlashcards = 0;

  for (const mod of syllabus.modules) {
    for (const concept of mod.concepts) {
      const lessonPath = path.join(ROOT, 'content', mod.slug, `${concept.id}.md`);
      const qbPath = path.join(ROOT, 'question-bank', mod.slug, `${concept.id}.json`);
      const fcPath = path.join(ROOT, 'flashcards', mod.slug, `${concept.id}.json`);

      // 1. Validate Lesson Markdown if present
      if (fs.existsSync(lessonPath)) {
        validatedLessons += 1;
        const content = fs.readFileSync(lessonPath, 'utf8');
        if (!content.startsWith('---')) {
          errors.push(`[Lesson] ${lessonPath}: falta frontmatter YAML.`);
        }
        for (const heading of REQUIRED_SECTIONS) {
          if (!content.includes(heading)) {
            errors.push(`[Lesson] ${concept.id}: falta la secció obligatòria "${heading}".`);
          }
        }
        if (!content.includes('```mermaid')) {
          warnings.push(`[Lesson] ${concept.id}: no s'ha detectat cap diagrama Mermaid.`);
        }
        if (!content.includes(':::hint')) {
          errors.push(`[Lesson] ${concept.id}: falta almenys un bloc :::hint a l'exercici G.`);
        }
        if (!content.includes(':::solution')) {
          errors.push(`[Lesson] ${concept.id}: falta el bloc :::solution ocult a l'exercici G.`);
        }
        const modelAnswers = (content.match(/:::model-answer/g) || []).length;
        if (modelAnswers < 3) {
          errors.push(
            `[Lesson] ${concept.id}: calen almenys 3 preguntes de desenvolupament amb :::model-answer (trobades: ${modelAnswers}).`
          );
        }
        if (!fs.existsSync(qbPath)) {
          errors.push(`[Lesson] ${concept.id}: existeix la lliçó però falta el test JSON (${qbPath}).`);
        }
        if (!fs.existsSync(fcPath)) {
          errors.push(`[Lesson] ${concept.id}: existeix la lliçó però falten les flashcards JSON (${fcPath}).`);
        }
      }

      // 2. Validate Question Bank JSON if present
      if (fs.existsSync(qbPath)) {
        validatedQuestionBanks += 1;
        let data;
        try {
          data = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
        } catch (err) {
          errors.push(`[QB] ${qbPath}: JSON invàlid (${err.message}).`);
          continue;
        }
        if (data.conceptId !== concept.id) {
          errors.push(`[QB] ${qbPath}: conceptId "${data.conceptId}" no coincideix amb "${concept.id}".`);
        }
        const questions = Array.isArray(data.questions) ? data.questions : [];
        if (questions.length < 10) {
          errors.push(`[QB] ${concept.id}: calen mínim 10 preguntes (trobades: ${questions.length}).`);
        }

        const diffCount = { basic: 0, intermediate: 0, advanced: 0 };
        const keyCount = { A: 0, B: 0, C: 0, D: 0 };

        for (const q of questions) {
          validatedQuestions += 1;
          if (!q.id || seenQuestionIds.has(q.id)) {
            errors.push(`[QB] ${concept.id}: ID de pregunta duplicat o buit (${q.id}).`);
          } else {
            seenQuestionIds.add(q.id);
          }

          const norm = normalizePrompt(q.prompt || '');
          if (!norm || norm.length < 15) {
            errors.push(`[QB] ${q.id}: enunciat massa curt o buit.`);
          } else if (seenPrompts.has(norm)) {
            errors.push(`[QB] ${q.id}: enunciat duplicat amb ${seenPrompts.get(norm)}.`);
          } else {
            seenPrompts.set(norm, q.id);
          }

          if (!VALID_DIFFICULTIES.has(q.difficulty)) {
            errors.push(`[QB] ${q.id}: dificultat invàlida "${q.difficulty}".`);
          } else {
            diffCount[q.difficulty] += 1;
          }

          if (!Array.isArray(q.options) || q.options.length !== 4) {
            errors.push(`[QB] ${q.id}: ha de tenir exactament 4 opcions.`);
          } else {
            const keys = q.options.map((o) => o.key);
            for (const k of VALID_KEYS) {
              if (!keys.includes(k)) {
                errors.push(`[QB] ${q.id}: falta l'opció ${k}.`);
              }
            }
          }

          if (!VALID_KEYS.includes(q.correctOption)) {
            errors.push(`[QB] ${q.id}: correctOption invàlida "${q.correctOption}".`);
          } else {
            keyCount[q.correctOption] += 1;
          }

          if (!q.explanationCorrect || q.explanationCorrect.trim().length < 20) {
            errors.push(`[QB] ${q.id}: explanationCorrect massa curta o buida.`);
          }

          const inc = q.explanationsIncorrect || {};
          for (const k of VALID_KEYS) {
            if (k === q.correctOption) continue;
            if (!inc[k] || inc[k].trim().length < 15) {
              errors.push(`[QB] ${q.id}: falta explicació detallada per a l'opció incorrecta ${k}.`);
            }
          }

          if (!q.lessonRef) {
            errors.push(`[QB] ${q.id}: falta lessonRef.`);
          }
        }

        // Check difficulty balance (target 30/40/30)
        if (questions.length >= 10) {
          if (diffCount.basic < 2 || diffCount.intermediate < 3 || diffCount.advanced < 2) {
            warnings.push(
              `[QB] ${concept.id}: distribució de dificultats desequilibrada (${JSON.stringify(diffCount)}).`
            );
          }
          const maxKey = Math.max(...Object.values(keyCount));
          if (maxKey > Math.ceil(questions.length * 0.5)) {
            warnings.push(
              `[QB] ${concept.id}: possible patró en la posició de respostes correctes (${JSON.stringify(keyCount)}).`
            );
          }
        }
      }

      // 3. Validate Flashcards JSON if present
      if (fs.existsSync(fcPath)) {
        let fc;
        try {
          fc = JSON.parse(fs.readFileSync(fcPath, 'utf8'));
        } catch (err) {
          errors.push(`[FC] ${fcPath}: JSON invàlid (${err.message}).`);
          continue;
        }
        const cards = Array.isArray(fc.cards) ? fc.cards : [];
        if (cards.length < 5) {
          errors.push(`[FC] ${concept.id}: calen mínim 5 flashcards (trobades: ${cards.length}).`);
        }
        for (const card of cards) {
          validatedFlashcards += 1;
          if (!card.id || seenCardIds.has(card.id)) {
            errors.push(`[FC] ${concept.id}: ID de flashcard duplicat o buit (${card.id}).`);
          } else {
            seenCardIds.add(card.id);
          }
          if (!card.front || !card.back) {
            errors.push(`[FC] ${card.id}: front o back buits.`);
          }
        }
      }
    }
  }

  console.log('=== VALIDACIÓ DEL CONTINGUT ===');
  console.log(`Lliçons validades: ${validatedLessons}`);
  console.log(`Bancs de preguntes validats: ${validatedQuestionBanks} (${validatedQuestions} preguntes)`);
  console.log(`Flashcards validades: ${validatedFlashcards}`);
  console.log(`Avisos: ${warnings.length} | Errors: ${errors.length}`);

  if (warnings.length > 0) {
    console.log('\n--- AVISOS ---');
    for (const w of warnings) console.log('  !', w);
  }
  if (errors.length > 0) {
    console.error('\n--- ERRORS ---');
    for (const e of errors) console.error('  ✗', e);
    process.exit(1);
  }
  console.log('\n✓ Validació completada sense errors.');
}

main();
