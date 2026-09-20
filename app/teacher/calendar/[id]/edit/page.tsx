'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Save,
  ArrowLeft,
  Calendar as CalIcon,
  Trash2,
  Video,
  PenTool,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Subject = { id: string; name: string; code: string };

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    date: '',
    startTime: '15:00',
    duration: 60,
    telemostLink: '',
    boardLink: '',
    status: 'SCHEDULED',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch(`/api/lessons/${id}`).then((r) => r.json()),
    ])
      .then(([subjectsData, lessonData]) => {
        setSubjects(subjectsData);
        if (lessonData.error) throw new Error(lessonData.error);

        const start = new Date(lessonData.startAt);
        const end = new Date(lessonData.endAt);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);

        const dateStr = start.toISOString().split('T')[0];
        const timeStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;

        setForm({
          title: lessonData.title || '',
          subjectId: lessonData.subjectId,
          date: dateStr,
          startTime: timeStr,
          duration: duration || 60,
          telemostLink: lessonData.telemostLink || '',
          boardLink: lessonData.boardLink || '',
          status: lessonData.status,
        });
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setFetching(false));
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return toast.error('Выбери дату');

    const startAt = new Date(`${form.date}T${form.startTime}:00`);
    const endAt = new Date(startAt.getTime() + form.duration * 60 * 1000);

    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title || 'Занятие',
          subjectId: form.subjectId,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          telemostLink: form.telemostLink,
          boardLink: form.boardLink,
          status: form.status,
        }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      toast.success('Занятие обновлено');
      router.push('/teacher/calendar');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelLesson = async () => {
    if (!confirm('Отменить занятие?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка отмены');
      toast.success('Занятие отменено');
      router.push('/teacher/calendar');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-64 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/teacher/calendar"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
          <CalIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Редактирование</h1>
          <p className="text-slate-400 text-sm">
            Измени данные или отмени занятие
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Предмет</Label>
          <select
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
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
          <Label className="text-slate-300">Тема</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
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
            Ссылка на Телемост
          </Label>
          <Input
            value={form.telemostLink}
            onChange={(e) => setForm({ ...form, telemostLink: e.target.value })}
            placeholder="https://telemost.yandex.ru/j/..."
            className="mt-2 bg-white/5 border-white/10 text-white"
          />
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
        </div>

        <div>
          <Label className="text-slate-300">Статус</Label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
          >
            <option value="SCHEDULED">Запланировано</option>
            <option value="COMPLETED">Проведено</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            type="button"
            onClick={cancelLesson}
            disabled={loading}
            variant="outline"
            className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Отменить
          </Button>
        </div>
      </form>
    </div>
  );
}