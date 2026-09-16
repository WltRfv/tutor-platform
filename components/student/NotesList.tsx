'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown } from 'lucide-react';

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  topic: string | null;
  createdAt: Date | string;
};

export function NotesList({
  notes,
  subjectLabels,
}: {
  notes: Note[];
  subjectLabels: Record<string, string>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const isOpen = openId === note.id;
        return (
          <motion.div
            key={note.id}
            layout
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : note.id)}
              className="w-full flex items-center gap-4 p-5 text-left group"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex-shrink-0">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{note.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                    {subjectLabels[note.subject] || note.subject}
                  </span>
                  {note.topic && (
                    <span className="text-xs text-slate-400 truncate">{note.topic}</span>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition-transform flex-shrink-0 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-2 border-t border-white/5">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}