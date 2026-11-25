import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const rawId = useId();
  const safeId = `mmd-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [svg, setSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<boolean>(false);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'strict',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      });
      mermaidInitialized = true;
    }

    let cancelled = false;
    async function render() {
      try {
        const { svg: renderedSvg } = await mermaid.render(safeId, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
          setRenderError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : 'Error renderitzant el diagrama Mermaid');
        }
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, safeId]);

  if (renderError) {
    return (
      <div className="my-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">No s’ha pogut renderitzar el diagrama interactiu:</p>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium uppercase tracking-wide text-slate-600">Diagrama interactiu (Mermaid)</span>
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
        >
          {zoomed ? 'Reduir' : 'Ampliar'}
        </button>
      </div>
      <div
        className={`overflow-x-auto flex justify-center transition-all ${zoomed ? 'scale-110 origin-top py-4' : ''}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
};
