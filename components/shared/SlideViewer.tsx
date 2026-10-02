'use client';
import { useState, useEffect, useCallback } from 'react';
import { MathText } from './MathText';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Slide = {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
};

export function SlideViewer({
  presentationTitle,
  slides,
}: {
  presentationTitle: string;
  slides: Slide[];
}) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
      if (e.key === 'Escape' && fullscreen) setFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, fullscreen]);

  if (slides.length === 0) return null;

  const slide = slides[index];

  const content = (
    <>
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-4xl">
          {slide.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
              {slide.title}
            </h2>
          )}
          {slide.imageUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 max-h-[50vh] flex items-center justify-center bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imageUrl}
                alt=""
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>
          )}
          <MathText className="text-slate-200 leading-relaxed text-lg">
            {slide.content}
          </MathText>
        </div>
      </div>

      {/* Навигация */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10">
        <button
          onClick={prev}
          disabled={index === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад
        </button>

        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                'w-2 h-2 rounded-full transition',
                i === index
                  ? 'bg-purple-400 w-6'
                  : 'bg-white/20 hover:bg-white/40'
              )}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {index + 1} / {slides.length}
          </span>
          <button
            onClick={next}
            disabled={index === slides.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Вперёд
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Layers className="h-4 w-4" />
            {presentationTitle}
          </div>
          <button
            onClick={() => setFullscreen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            title="Полный экран"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {content}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Layers className="h-4 w-4" />
              {presentationTitle}
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              title="Выйти из полного экрана (Esc)"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
          {content}
        </div>
      )}
    </>
  );
}