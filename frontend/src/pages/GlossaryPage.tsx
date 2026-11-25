import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Library, Search } from 'lucide-react';
import type { GlossaryTerm } from '../types/academy';

export const GlossaryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [moduleFilter, setModuleFilter] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/glossary.json')
      .then((res) => (res.ok ? res.json() : { terms: [] }))
      .then((data: { terms?: GlossaryTerm[] }) => {
        if (!cancelled) setTerms(data.terms ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms.filter((t) => {
      if (moduleFilter > 0 && t.module !== moduleFilter) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.english.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      );
    });
  }, [terms, query, moduleFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Library className="h-6 w-6 text-indigo-700" />
          Glossari Tècnic Bilingüe (Català / Anglès)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Definicions rigoroses de la terminologia clau dels 8 mòduls oficials.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca terme en català o anglès..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value={0}>Tots els mòduls</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((m) => (
              <option key={m} value={m}>
                Mòdul {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">{item.term}</h2>
                <p className="text-xs font-mono text-indigo-700">{item.english}</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                Mòdul {item.module}
              </span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-700">{item.definition}</p>
            <Link
              to={`/lliço/${item.conceptId}`}
              className="mt-3 inline-block text-xs font-semibold text-indigo-700 hover:underline"
            >
              Anar a la lliçó relacionada →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
