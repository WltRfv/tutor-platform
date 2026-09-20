'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, PenTool } from 'lucide-react';
import { useState } from 'react';

const Tldraw = dynamic(async () => (await import('tldraw')).Tldraw, {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-slate-400 flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        Загрузка доски...
      </div>
    </div>
  ),
});

export function BoardClient({
  userName,
  lessonId,
  backUrl,
}: {
  userName: string;
  lessonId: string | null;
  backUrl: string;
}) {
  const [editor, setEditor] = useState<any>(null);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
            >
            <ArrowLeft className="h-4 w-4" />
            Назад
            </Link>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <PenTool className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-medium text-sm">Онлайн-доска</span>
          </div>
        </div>

        <span className="text-xs text-slate-500 hidden md:block">👤 {userName}</span>
      </header>

      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <Tldraw
          onMount={(ed: any) => setEditor(ed)}
          colorScheme="dark"
          persistenceKey={lessonId ? `board-${lessonId}` : 'board-default'}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 text-xs text-slate-400 pointer-events-none">
        💡 Поделись экраном в Телемосте — и рисуй вместе с учеником
      </div>
    </div>
  );
}