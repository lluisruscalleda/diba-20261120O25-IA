import React, { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Library,
  Menu,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { manifest, searchIndex, progress, backendSynced } = useAcademy();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 1: true });
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleModule = (modId: number) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return searchIndex
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.excerpt.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, searchIndex]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/examens', label: 'Mode examen', icon: ClipboardCheck },
    { to: '/repas', label: 'Repàs espaiat', icon: RefreshCw },
    { to: '/pla-estudi', label: "Pla d'estudi", icon: Calendar },
    { to: '/laboratoris', label: 'Laboratoris i projecte', icon: FlaskConical },
    { to: '/glossari', label: 'Glossari tècnic', icon: Library },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">Acadèmia IA</p>
            <p className="text-[11px] text-slate-400">Diputació de Barcelona</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 lg:hidden"
          aria-label="Tancar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary tools navigation */}
      <nav className="space-y-1 border-b border-slate-800 px-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Syllabus tree (8 modules) */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Temari oficial (8 mòduls)
        </p>
        <div className="space-y-1">
          {manifest?.modules.map((mod) => {
            const isOpen = Boolean(expandedModules[mod.id]);
            const completedInMod = mod.concepts.filter(
              (c) => Boolean(progress.completedLessons[c.id])
            ).length;
            return (
              <div key={mod.id} className="rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/70"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                    <span className="truncate">
                      M{mod.id}. {mod.shortTitle}
                    </span>
                  </span>
                  <span className="ml-2 shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {completedInMod}/{mod.totalConcepts}
                  </span>
                </button>
                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-800 pl-2">
                    {mod.concepts.map((c) => {
                      const done = Boolean(progress.completedLessons[c.id]);
                      const fav = progress.favorites.includes(c.id);
                      return (
                        <NavLink
                          key={c.id}
                          to={`/lliço/${c.id}`}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center justify-between gap-1.5 rounded-md px-2 py-1.5 text-xs transition ${
                              isActive
                                ? 'bg-indigo-600/30 font-semibold text-indigo-200'
                                : c.hasLesson
                                  ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                  : 'text-slate-500 hover:bg-slate-800/40'
                            }`
                          }
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            {done ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            ) : (
                              <BookOpen
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  c.hasLesson ? 'text-indigo-400' : 'text-slate-600'
                                }`}
                              />
                            )}
                            <span className="truncate">
                              {c.order}. {c.title}
                            </span>
                          </span>
                          {fav && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Persistence status footer */}
      <div className="border-t border-slate-800 px-4 py-2.5 text-[11px] text-slate-400">
        Persistència: {backendSynced ? 'SQLite local + navegador' : 'Navegador (localStorage)'}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 max-w-[85vw]">{sidebarContent}</div>
          <div className="flex-1 bg-slate-950/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Obrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative w-64 sm:w-96">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 180)}
                placeholder="Cerca conceptes, temari o glossari..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {searchResults.map((res) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      type="button"
                      onMouseDown={() => {
                        setQuery('');
                        navigate(res.url);
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">{res.title}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {res.type === 'glossary' ? 'Glossari' : `M${res.module}`}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{res.excerpt}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
            <span>
              Lliçons disponibles:{' '}
              <strong className="text-slate-800">
                {manifest?.stats.readyLessons ?? 0}/{manifest?.stats.totalConcepts ?? 70}
              </strong>
            </span>
            <span>·</span>
            <span>
              Preguntes: <strong className="text-slate-800">{manifest?.stats.totalQuestions ?? 0}</strong>
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};
