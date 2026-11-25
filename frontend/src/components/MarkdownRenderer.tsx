import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Info,
  Lightbulb,
  Scale,
} from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';
import { parseCustomDirectives } from '../utils/markdownBlocks';

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? '');
  const lang = match ? match[1] : '';
  const codeText = String(children ?? '').replace(/\n$/, '');

  if (lang === 'mermaid') {
    return <MermaidDiagram chart={codeText} />;
  }

  if (!match) {
    return <code className={className}>{children}</code>;
  }

  const handleCopy = () => {
    void navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="not-prose my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300">
        <span className="font-mono uppercase tracking-wider text-slate-400">{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700"
          aria-label="Copiar codi"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiat' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-100">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

interface MarkdownFragmentProps {
  content: string;
}

const MarkdownFragment: React.FC<MarkdownFragmentProps> = ({ content }) => {
  return (
    <div className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-h3:text-slate-900 prose-a:text-indigo-700 hover:prose-a:text-indigo-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className && /language-/.test(className));
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface CollapsibleDirectiveProps {
  kind: 'hint' | 'solution' | 'model-answer';
  title: string;
  content: string;
}

const CollapsibleDirective: React.FC<CollapsibleDirectiveProps> = ({ kind, title, content }) => {
  const [open, setOpen] = useState(false);

  const styles =
    kind === 'hint'
      ? {
          border: 'border-amber-200',
          bg: 'bg-amber-50/70',
          headerText: 'text-amber-900',
          icon: <Lightbulb className="h-4 w-4 text-amber-600" />,
          closedLabel: 'Mostrar pista',
          openLabel: 'Amagar pista',
        }
      : kind === 'solution'
        ? {
            border: 'border-emerald-200',
            bg: 'bg-emerald-50/60',
            headerText: 'text-emerald-950',
            icon: open ? <EyeOff className="h-4 w-4 text-emerald-700" /> : <Eye className="h-4 w-4 text-emerald-700" />,
            closedLabel: 'Revelar solució completa',
            openLabel: 'Ocultar solució',
          }
        : {
            border: 'border-indigo-200',
            bg: 'bg-indigo-50/60',
            headerText: 'text-indigo-950',
            icon: open ? <ChevronDown className="h-4 w-4 text-indigo-700" /> : <ChevronRight className="h-4 w-4 text-indigo-700" />,
            closedLabel: 'Veure resposta model i criteris',
            openLabel: 'Ocultar resposta model',
          };

  return (
    <div className={`my-4 overflow-hidden rounded-xl border ${styles.border} ${styles.bg}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold ${styles.headerText} hover:opacity-90`}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {styles.icon}
          {title}
        </span>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium shadow-2xs">
          {open ? styles.openLabel : styles.closedLabel}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-200/80 bg-white px-5 py-4">
          <MarkdownFragment content={content} />
        </div>
      )}
    </div>
  );
};

interface MarkdownRendererProps {
  markdown: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown }) => {
  const chunks = useMemo(() => parseCustomDirectives(markdown), [markdown]);

  return (
    <div>
      {chunks.map((chunk, index) => {
        if (chunk.type === 'markdown') {
          return <MarkdownFragment key={`md-${index}`} content={chunk.content} />;
        }

        if (chunk.kind === 'hint' || chunk.kind === 'solution' || chunk.kind === 'model-answer') {
          return (
            <CollapsibleDirective
              key={`dir-${index}`}
              kind={chunk.kind}
              title={chunk.title}
              content={chunk.content}
            />
          );
        }

        const calloutStyle =
          chunk.kind === 'callout-warning'
            ? {
                box: 'border-rose-200 bg-rose-50 text-rose-950',
                icon: <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />,
              }
            : chunk.kind === 'callout-legal'
              ? {
                  box: 'border-sky-200 bg-sky-50 text-sky-950',
                  icon: <Scale className="h-5 w-5 shrink-0 text-sky-700" />,
                }
              : {
                  box: 'border-slate-200 bg-slate-50 text-slate-900',
                  icon: <Info className="h-5 w-5 shrink-0 text-indigo-600" />,
                };

        return (
          <div key={`call-${index}`} className={`my-4 rounded-xl border p-4 ${calloutStyle.box}`}>
            <div className="mb-2 flex items-center gap-2 font-semibold">
              {calloutStyle.icon}
              <span>{chunk.title}</span>
            </div>
            <MarkdownFragment content={chunk.content} />
          </div>
        );
      })}
    </div>
  );
};
