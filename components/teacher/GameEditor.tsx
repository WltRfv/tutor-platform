'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CardsItemsEditor, type CardItem } from './game-editors/CardsItemsEditor';
import { MatchingItemsEditor, type MatchingItem } from './game-editors/MatchingItemsEditor';
import { HintsItemsEditor, type HintsItem } from './game-editors/HintsItemsEditor';
import { FindErrorItemsEditor, type FindErrorItem } from './game-editors/FindErrorItemsEditor';
import { QuizItemsEditor, type QuizItem } from './game-editors/QuizItemsEditor';
import {
  GAME_TYPE_LABELS,
  type GameType,
  parseCardsPayload,
  parseMatchingPayload,
  parseHintsPayload,
  parseFindErrorPayload,
  parseQuizPayload,
} from '@/types/game';

type Subject = { id: string; name: string };
type Topic = { id: string; title: string; subjectId: string };

type Props = {
  gameId?: string;
  defaultType?: GameType;
  initial?: {
    type: GameType;
    title: string;
    description: string;
    subjectId: string;
    topicId: string;
    published: boolean;
    items: Array<{ id?: string; payload: unknown }>;
  };
};

const AVAILABLE_TYPES: GameType[] = [
  'CARDS', 'MATCHING', 'HINTS', 'FIND_ERROR', 'QUIZ', 'TRAINER',
];

const TYPE_DESCRIPTION: Partial<Record<GameType, string>> = {
  CARDS: 'Ученик читает вопрос, открывает ответ, отмечает «знал / не знал»',
  MATCHING: 'Ученик сопоставляет понятия и определения — клик слева и справа',
  HINTS: 'Ученик угадывает ответ по подсказкам — от размытой к точной',
  FIND_ERROR: 'Ученик решает, есть ли ошибка в утверждении, и исправляет её',
  QUIZ: 'Викторина с выбором ответа — счёт в конце',
  TRAINER: 'Тренажёр с выбором ответа — мгновенная проверка',
};

export function GameEditor({ gameId, defaultType, initial }: Props) {
  const router = useRouter();
  const isEdit = Boolean(gameId);
  const gameType: GameType = initial?.type ?? defaultType ?? 'CARDS';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    subjectId: initial?.subjectId ?? '',
    topicId: initial?.topicId ?? '',
    published: initial?.published ?? false,
  });

  const initialCards = useMemo<CardItem[]>(() => {
    if (gameType !== 'CARDS' || !initial?.items?.length) {
      return gameType === 'CARDS' ? [{ question: '', answer: '' }] : [];
    }
    return initial.items.map((it) => {
      const p = parseCardsPayload(it.payload);
      return { id: it.id, question: p.question, answer: p.answer };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialPairs = useMemo<MatchingItem[]>(() => {
    if (gameType !== 'MATCHING' || !initial?.items?.length) {
      return gameType === 'MATCHING' ? [{ left: '', right: '' }, { left: '', right: '' }] : [];
    }
    return initial.items.map((it) => {
      const p = parseMatchingPayload(it.payload);
      return { id: it.id, left: p.left, right: p.right };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialHints = useMemo<HintsItem[]>(() => {
    if (gameType !== 'HINTS' || !initial?.items?.length) {
      return gameType === 'HINTS' ? [{ answer: '', hints: [''] }] : [];
    }
    return initial.items.map((it) => {
      const p = parseHintsPayload(it.payload);
      return { id: it.id, answer: p.answer, hints: p.hints.length ? p.hints : [''] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialFindError = useMemo<FindErrorItem[]>(() => {
    if (gameType !== 'FIND_ERROR' || !initial?.items?.length) {
      return gameType === 'FIND_ERROR'
        ? [{ statement: '', hasError: true, correction: '', explanation: '' }]
        : [];
    }
    return initial.items.map((it) => {
      const p = parseFindErrorPayload(it.payload);
      return {
        id: it.id,
        statement: p.statement,
        hasError: p.hasError,
        correction: p.correction ?? '',
        explanation: p.explanation ?? '',
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialQuiz = useMemo<QuizItem[]>(() => {
    if ((gameType !== 'QUIZ' && gameType !== 'TRAINER') || !initial?.items?.length) {
      return gameType === 'QUIZ' || gameType === 'TRAINER'
        ? [{ text: '', options: ['', '', '', ''], correct: 0, explanation: '' }]
        : [];
    }
    return initial.items.map((it) => {
      const p = parseQuizPayload(it.payload);
      return {
        id: it.id,
        text: p.text,
        options: p.options.length ? p.options : ['', ''],
        correct: p.correct,
        explanation: p.explanation ?? '',
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [pairs, setPairs] = useState<MatchingItem[]>(initialPairs);
  const [hints, setHints] = useState<HintsItem[]>(initialHints);
  const [findError, setFindError] = useState<FindErrorItem[]>(initialFindError);
  const [quiz, setQuiz] = useState<QuizItem[]>(initialQuiz);

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/topics').then((r) => r.json()),
    ])
      .then(([s, t]) => {
        setSubjects(s);
        setTopics(t);
        setForm((f) =>
          !f.subjectId && s.length > 0 ? { ...f, subjectId: s[0].id } : f
        );
      })
      .catch(() => toast.error('Не удалось загрузить данные'))
      .finally(() => setFetching(false));
  }, []);

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);

  const buildItems = (): Array<{ payload: Record<string, unknown> }> | null => {
    if (gameType === 'CARDS') {
      const clean = cards
        .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }))
        .filter((c) => c.question && c.answer);
      if (!clean.length) return toast.error('Заполни хотя бы одну карточку'), null;
      return clean.map((p) => ({ payload: p }));
    }
    if (gameType === 'MATCHING') {
      const clean = pairs
        .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
        .filter((p) => p.left && p.right);
      if (clean.length < 2) return toast.error('Нужно минимум 2 пары'), null;
      return clean.map((p) => ({ payload: p }));
    }
    if (gameType === 'HINTS') {
      const clean = hints
        .map((h) => ({
          answer: h.answer.trim(),
          hints: h.hints.map((x) => x.trim()).filter(Boolean),
        }))
        .filter((h) => h.answer && h.hints.length);
      if (!clean.length) return toast.error('Нужен хотя бы один вопрос'), null;
      return clean.map((h) => ({ payload: h }));
    }
    if (gameType === 'FIND_ERROR') {
      const clean = findError
        .map((f) => ({
          statement: f.statement.trim(),
          hasError: f.hasError,
          correction: f.correction.trim() || undefined,
          explanation: f.explanation.trim() || undefined,
        }))
        .filter((f) => f.statement);
      if (!clean.length) return toast.error('Нужно хотя бы одно утверждение'), null;
      return clean.map((p) => ({ payload: p }));
    }
    if (gameType === 'QUIZ' || gameType === 'TRAINER') {
      const clean = quiz
        .map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()),
          correct: q.correct,
          explanation: q.explanation.trim() || undefined,
        }))
        .filter((q) => q.text && q.options.filter(Boolean).length >= 2);
      if (!clean.length) return toast.error('Нужен хотя бы один вопрос'), null;
      return clean.map((p) => ({ payload: p }));
    }
    toast.error('Тип не поддерживается');
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Введи название');
    if (!form.subjectId) return toast.error('Выбери предмет');
    const items = buildItems();
    if (!items) return;

    setLoading(true);
    try {
      const url = gameId ? `/api/teacher/games/${gameId}` : '/api/teacher/games';
      const method = gameId ? 'PATCH' : 'POST';
      const body: any = {
        title: form.title,
        description: form.description || null,
        subjectId: form.subjectId,
        topicId: form.topicId || null,
        published: form.published,
        items,
      };
      if (!gameId) body.type = gameType;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      toast.success(gameId ? 'Обновлено' : 'Создано');
      router.push('/teacher/games');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="p-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-64 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    );

  if (!AVAILABLE_TYPES.includes(gameType))
    return (
      <div className="p-8 max-w-2xl">
        <Link href="/teacher/games" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> К играм
        </Link>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
          Тип «{GAME_TYPE_LABELS[gameType]}» пока в разработке
        </div>
      </div>
    );

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/teacher/games" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> К играм
      </Link>
      <h1 className="text-3xl font-bold text-white mb-1">
        {isEdit ? `Редактирование — ${GAME_TYPE_LABELS[gameType]}` : `Новая игра — ${GAME_TYPE_LABELS[gameType]}`}
      </h1>
      <p className="text-slate-400 mb-6">{TYPE_DESCRIPTION[gameType]}</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Название</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-2 bg-white/5 border-white/10 text-white"
            required
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Предмет</Label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value, topicId: '' })}
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
              required
            >
              <option value="">- Выбери -</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-slate-300">Тема (необязательно)</Label>
            <select
              value={form.topicId}
              onChange={(e) => setForm({ ...form, topicId: e.target.value })}
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
            >
              <option value="">- Без темы -</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Описание (необязательно)</Label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="mt-2 w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm resize-y focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {gameType === 'CARDS' && <CardsItemsEditor items={cards} onChange={setCards} />}
        {gameType === 'MATCHING' && <MatchingItemsEditor items={pairs} onChange={setPairs} />}
        {gameType === 'HINTS' && <HintsItemsEditor items={hints} onChange={setHints} />}
        {gameType === 'FIND_ERROR' && <FindErrorItemsEditor items={findError} onChange={setFindError} />}
        {(gameType === 'QUIZ' || gameType === 'TRAINER') && (
          <QuizItemsEditor items={quiz} onChange={setQuiz} />
        )}

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">Опубликовать</span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать игру'}
        </Button>
      </form>
    </div>
  );
}