'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Save,
  ArrowLeft,
  Calendar as CalIcon,
  Video,
  PenTool,
} from 'lucide-react';
import Link from 'next/link';

type Subject = { id: string; name: string; code: string };
type Student = {
  id: string;
  name: string;
  grade: number | null;
  email: string;
  subjects: { id: string; name: string }[];
};

export default function NewLessonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    date: '',
    startTime: '15:00',
    duration: 60,
    userId: '',
    telemostLink: '',
    boardLink: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/students-list').then((r) => r.json()),
    ])
      .then(([subjectsData, studentsData]) => {
        setSubjects(subjectsData);
        setStudents(studentsData);
        if (subjectsData.length > 0 && !form.subjectId) {
          setForm((f) => ({ ...f, subjectId: subjectsData[0].id }));
        }
      })
      .catch(() => toast.error('Не удалось загрузить данные'));
  }, []);

  const filteredStudents = students.filter((s) =>
    s.subjects?.some((sub) => sub.id === form.subjectId)
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) return toast.error('Выбери ученика');
    if (!form.date) return toast.error('Выбери дату');
    if (!form.subjectId) return toast.error('Выбери предмет');

    const startAt = new Date(`${form.date}T${form.startTime}:00`);
    const endAt = new Date(startAt.getTime() + form.duration * 60 * 1000);

    setLoading(true);
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title || 'Занятие',
          subjectId: form.subjectId,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          telemostLink: form.telemostLink,
          boardLink: form.boardLink,
          userId: form.userId,
        }),
      });
      if (!res.ok) throw new Error('Ошибка создания');
      toast.success('Занятие создано');
      router.push('/teacher/calendar');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/teacher/calendar"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к расписанию
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
          <CalIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Новое занятие</h1>
          <p className="text-slate-400 text-sm">Запланируй занятие с учеником</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Предмет</Label>
          <select
            value={form.subjectId}
            onChange={(e) =>
              setForm({ ...form, subjectId: e.target.value, userId: '' })
            }
            className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
            required
          >
            <option value="">— Выбери предмет —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-slate-300">Ученик</Label>
          {filteredStudents.length === 0 ? (
            <p className="mt-2 text-sm text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              ⚠️ Нет учеников с этим предметом
            </p>
          ) : (
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
              required
            >
              <option value="">— Выбери ученика —</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.grade ? `(${s.grade} кл.)` : ''} — {s.email}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <Label className="text-slate-300">Тема занятия (необязательно)</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: Разбор задач ОГЭ"
            className="mt-2 bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-300">Дата</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-2 bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          <div>
            <Label className="text-slate-300">Время</Label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="mt-2 bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          <div>
            <Label className="text-slate-300">Длительность</Label>
            <select
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
            >
              <option value={45}>45 мин</option>
              <option value={60}>60 мин</option>
              <option value={90}>90 мин</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-slate-300 flex items-center gap-2">
            <Video className="h-4 w-4 text-emerald-400" />
            Ссылка на Телемост / Zoom
          </Label>
          <Input
            value={form.telemostLink}
            onChange={(e) => setForm({ ...form, telemostLink: e.target.value })}
            placeholder="https://telemost.yandex.ru/j/..."
            className="mt-2 bg-white/5 border-white/10 text-white"
          />
          <p className="text-xs text-slate-500 mt-2">
            💡 Ученик увидит кнопку «Открыть Телемост» в карточке занятия
          </p>
        </div>

        <div>
          <Label className="text-slate-300 flex items-center gap-2">
            <PenTool className="h-4 w-4 text-purple-400" />
            Ссылка на онлайн-доску
          </Label>
            <Input
            value={form.boardLink}
            onChange={(e) => setForm({ ...form, boardLink: e.target.value })}
            placeholder="https://..."
            className="mt-2 bg-white/5 border-white/10 text-white"
            />
          <p className="text-xs text-slate-500 mt-2">
            💡 Создай доску и вставь ссылку — ученик откроет её одним
            кликом
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Создание...' : 'Создать занятие'}
        </Button>
      </form>
    </div>
  );
}