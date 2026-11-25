import React, { useState } from 'react';
import { FlaskConical, FolderGit2, Terminal } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const LabsAndProjectPage: React.FC = () => {
  const { manifest } = useAcademy();
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; markdown: string } | null>(null);

  const openReadme = async (title: string, path: string | null) => {
    if (!path) return;
    const res = await fetch(path);
    if (!res.ok) return;
    const text = await res.text();
    setSelectedDoc({ title, markdown: text });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <FlaskConical className="h-6 w-6 text-indigo-700" />
          Laboratoris Pràctics i Projecte Final Integrador
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tots els laboratoris i el projecte final s’executen localment amb Python, Jupyter Notebooks
          i datasets sintètics (sense dades personals reals ni dependència de serveis de pagament).
        </p>
      </div>

      {selectedDoc && (
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">{selectedDoc.title}</h2>
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tancar guia
            </button>
          </div>
          <MarkdownRenderer markdown={selectedDoc.markdown} />
        </div>
      )}

      {/* Final Project Card */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-700 px-3 py-0.5 text-xs font-bold text-white">
              <FolderGit2 className="h-3.5 w-3.5" />
              PROJECTE INTEGRADOR (8 MÒDULS)
            </span>
            <h2 className="mt-2.5 text-xl font-bold text-slate-900">
              {manifest?.finalProject.title}
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Flux complet de suport a la tramitació: recepció → PDF → OCR → classificació →
              extracció → validació per regles → anomalies → priorització → RAG normatiu → resum →
              revisió humana obligatòria → auditoria → monitoratge.
            </p>
          </div>
          {manifest?.finalProject.available ? (
            <button
              type="button"
              onClick={() =>
                void openReadme(manifest.finalProject.title, manifest.finalProject.readmePath)
              }
              className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Obrir documentació
            </button>
          ) : (
            <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              Planificat a la Fase 6 (<code>final-project/</code>)
            </span>
          )}
        </div>
      </div>

      {/* 8 Labs Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {manifest?.labs.map((lab) => (
          <div
            key={lab.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  MÒDUL {lab.module}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    lab.available
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {lab.available ? 'Disponible' : 'Fase 4'}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">{lab.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{lab.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="inline-flex items-center gap-1 font-mono text-slate-500">
                <Terminal className="h-3.5 w-3.5" />
                {lab.path}
              </span>
              {lab.available && (
                <button
                  type="button"
                  onClick={() => void openReadme(lab.title, lab.readmePath)}
                  className="font-semibold text-indigo-700 hover:underline"
                >
                  Guia d’execució →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
