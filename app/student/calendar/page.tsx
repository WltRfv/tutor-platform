import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-2">Расписание занятий</h1>
      <p className="text-slate-400 mb-8">Здесь будут твои занятия и ссылки на видеозвонки</p>

      <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Интеграция с Google Calendar появится позже</p>
      </div>
    </div>
  );
}