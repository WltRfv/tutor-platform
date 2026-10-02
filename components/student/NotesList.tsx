'use client';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  subjectName: string;
  topic: string | null;
  createdAt: Date | string;
};

export function NotesList({ notes }: { notes: Note[] }) {
  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/student/notes/${note.id}`}
          className="block backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/40 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex-shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">{note.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                  {note.subjectName}
                </span>
                {note.topic && (
                  <span className="text-xs text-slate-400 truncate">{note.topic}</span>
                )}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}