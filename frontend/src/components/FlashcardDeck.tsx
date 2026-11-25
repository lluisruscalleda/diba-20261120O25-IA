import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import type { Flashcard } from '../types/academy';
import type { Sm2Quality } from '../utils/sm2';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onRate?: (cardId: string, quality: Sm2Quality) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onRate }) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        No hi ha flashcards disponibles per a aquest conjunt.
      </div>
    );
  }

  const card = cards[index % cards.length];

  const handleRate = (q: Sm2Quality) => {
    onRate?.(card.id, q);
    setFlipped(false);
    setIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Fitxa {(index % cards.length) + 1} de {cards.length}
        </span>
        <div className="flex gap-1.5">
          {card.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className="min-h-48 cursor-pointer rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-xs transition hover:border-indigo-300 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-700">
          <span>{flipped ? 'Resposta' : 'Pregunta / Concepte'}</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <RotateCw className="h-3.5 w-3.5" />
            Clic per girar
          </span>
        </div>

        <p className="my-6 text-center text-base font-medium leading-relaxed text-slate-900">
          {flipped ? card.back : card.front}
        </p>

        <div className="text-center text-xs text-slate-400">
          {flipped ? 'Valora el grau de record per programar el següent repàs' : 'Prem per comprovar la definició'}
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleRate(1)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            De nou (1 dia)
          </button>
          <button
            type="button"
            onClick={() => handleRate(3)}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            Difícil
          </button>
          <button
            type="button"
            onClick={() => handleRate(4)}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
          >
            Bé
          </button>
          <button
            type="button"
            onClick={() => handleRate(5)}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Fàcil
          </button>
        </div>
      ) : (
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((prev) => (prev - 1 + cards.length) % cards.length);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((prev) => (prev + 1) % cards.length);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Següent
          </button>
        </div>
      )}
    </div>
  );
};
