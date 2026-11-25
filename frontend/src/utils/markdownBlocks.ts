export type DirectiveKind =
  | 'hint'
  | 'solution'
  | 'model-answer'
  | 'callout-info'
  | 'callout-warning'
  | 'callout-legal';

export type ContentChunk =
  | { type: 'markdown'; content: string }
  | {
      type: 'directive';
      kind: DirectiveKind;
      title: string;
      content: string;
    };

export interface LessonSection {
  letter: string;
  heading: string;
  markdown: string;
}

export function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/, '').trim();
}

export function splitLessonIntoSections(rawMarkdown: string): {
  intro: string;
  sections: LessonSection[];
} {
  const clean = stripFrontmatter(rawMarkdown);
  const lines = clean.split(/\r?\n/);

  let introLines: string[] = [];
  const sections: LessonSection[] = [];
  let current: { letter: string; heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(/^##\s+([A-J])\.\s+(.+)$/);
    if (m) {
      if (current) {
        sections.push({
          letter: current.letter,
          heading: current.heading,
          markdown: current.lines.join('\n').trim(),
        });
      }
      current = { letter: m[1], heading: m[2].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (current) {
    sections.push({
      letter: current.letter,
      heading: current.heading,
      markdown: current.lines.join('\n').trim(),
    });
  }

  return {
    intro: introLines.join('\n').trim(),
    sections,
  };
}

const DEFAULT_TITLES: Record<DirectiveKind, string> = {
  hint: 'Pista opcional',
  solution: 'Solució completa comentada',
  'model-answer': 'Resposta model i criteris de correcció',
  'callout-info': 'Nota tècnica',
  'callout-warning': 'Atenció / Error freqüent',
  'callout-legal': 'Marc normatiu i Administració pública',
};

/**
 * Converteix blocs personalitzats :::hint, :::solution, :::model-answer i :::callout-*
 * en fragments estructurats perquè React els renderitzi com a components interactius.
 */
export function parseCustomDirectives(markdown: string): ContentChunk[] {
  const lines = markdown.split(/\r?\n/);
  const chunks: ContentChunk[] = [];
  let mdBuffer: string[] = [];
  let activeDirective: {
    kind: DirectiveKind;
    title: string;
    lines: string[];
  } | null = null;
  let insideFence = false;

  const flushMd = () => {
    const joined = mdBuffer.join('\n').trim();
    if (joined) {
      chunks.push({ type: 'markdown', content: joined });
    }
    mdBuffer = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      insideFence = !insideFence;
    }

    if (!insideFence && !activeDirective) {
      const openMatch = line.match(
        /^:::(hint|solution|model-answer|callout-info|callout-warning|callout-legal)(?:\s+(.*))?$/
      );
      if (openMatch) {
        flushMd();
        const kind: DirectiveKind = openMatch[1] as DirectiveKind;
        const title: string = openMatch[2]?.trim() || DEFAULT_TITLES[kind];
        activeDirective = { kind, title, lines: [] };
        continue;
      }
    }

    if (!insideFence && activeDirective && line.trim() === ':::') {
      chunks.push({
        type: 'directive',
        kind: activeDirective.kind,
        title: activeDirective.title,
        content: activeDirective.lines.join('\n').trim(),
      });
      activeDirective = null;
      continue;
    }

    if (activeDirective) {
      activeDirective.lines.push(line);
    } else {
      mdBuffer.push(line);
    }
  }

  if (activeDirective) {
    chunks.push({
      type: 'directive',
      kind: activeDirective.kind,
      title: activeDirective.title,
      content: activeDirective.lines.join('\n').trim(),
    });
  }
  flushMd();

  return chunks;
}
