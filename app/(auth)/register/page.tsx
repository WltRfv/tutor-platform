'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoriesForGrade, getSubjectCode, SUBJECT_NAMES } from '@/lib/subjects';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check } from 'lucide-react';

const MESSENGERS = [
  { id: 'telegram', label: 'Telegram', placeholder: '@username' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '+7 999 123-45-67' },
  { id: 'max', label: 'MAX', placeholder: '@username или телефон' },
  { id: 'vk', label: 'VK', placeholder: '@username или ссылка' },
] as const;

const GRADES = [5, 6, 7, 8, 9];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    messengerType: 'telegram' as string,
    messengerHandle: '',
  });

  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [activeGrade, setActiveGrade] = useState<number | null>(null);
  const [categoriesByGrade, setCategoriesByGrade] = useState<Record<number, string[]>>({});

  const selectGrade = (grade: number) => {
    if (!selectedGrades.includes(grade)) {
      setSelectedGrades([...selectedGrades, grade]);
    }
    setActiveGrade(grade);
  };

  const removeGrade = (grade: number) => {
    setSelectedGrades(selectedGrades.filter((g) => g !== grade));
    const next = { ...categoriesByGrade };
    delete next[grade];
    setCategoriesByGrade(next);
    if (activeGrade === grade) setActiveGrade(null);
  };

  const toggleCategory = (grade: number, catId: string) => {
    const current = categoriesByGrade[grade] || [];
    const updated = current.includes(catId)
      ? current.filter((c) => c !== catId)
      : [...current, catId];
    setCategoriesByGrade({ ...categoriesByGrade, [grade]: updated });
  };

  const totalSelected = Object.values(categoriesByGrade).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGrades.length === 0) return toast.error('Выбери хотя бы один класс');
    if (totalSelected === 0) return toast.error('Выбери хотя бы один предмет');
    if (!form.messengerHandle.trim())
      return toast.error('Укажи ник или телефон для связи');

    setLoading(true);
    try {
      const selections = selectedGrades
        .map((g) => ({ grade: g, categories: categoriesByGrade[g] || [] }))
        .filter((s) => s.categories.length > 0);

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, selections }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Заявка отправлена! Ожидай одобрения учителя.');
      router.push('/login');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const activeMessenger = MESSENGERS.find((m) => m.id === form.messengerType);
  const currentCategories = activeGrade ? getCategoriesForGrade(activeGrade) : [];
  const activeSelections = activeGrade ? categoriesByGrade[activeGrade] || [] : [];

  // Красивое имя предмета с классом, например "Алгебра 7" или "ВПР 7"
  const getDisplayName = (catId: string, grade: number) => {
    const code = getSubjectCode(catId, grade);
    if (code && SUBJECT_NAMES[code]) return SUBJECT_NAMES[code];
    const cat = getCategoriesForGrade(grade).find((c) => c.id === catId);
    return cat ? `${cat.label} ${grade}` : catId;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Регистрация ученика</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>ФИО</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Пароль</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {/* Мессенджер */}
            <div>
              <Label className="mb-2 block">Мессенджер для связи</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MESSENGERS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setForm({ ...form, messengerType: m.id })}
                    className={cn(
                      'px-3 py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-1.5',
                      form.messengerType === m.id
                        ? 'bg-purple-500/20 border-purple-500/50 text-white'
                        : 'border-white/10 text-slate-300 hover:bg-white/5'
                    )}
                  >
                    {form.messengerType === m.id && <Check className="h-3.5 w-3.5" />}
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ник/телефон */}
            <div>
              <Label>Ник или телефон в {activeMessenger?.label}</Label>
              <Input
                value={form.messengerHandle}
                onChange={(e) => setForm({ ...form, messengerHandle: e.target.value })}
                placeholder={activeMessenger?.placeholder}
                required
              />
            </div>

            {/* Блок классов */}
            <div>
              <Label className="mb-2 block">Классы и предметы</Label>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-4">
                {selectedGrades.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedGrades.map((g) => (
                      <div
                        key={g}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-white text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveGrade(g)}
                          className="font-medium hover:text-purple-200"
                        >
                          {g} класс
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGrade(g)}
                          className="text-slate-400 hover:text-red-400 text-xs leading-none"
                          aria-label="Убрать класс"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeGrade ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setActiveGrade(null)}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Назад к выбору классов
                    </button>
                    <div className="text-sm text-slate-300">
                      Предметы для{' '}
                      <span className="text-white font-semibold">
                        {activeGrade} класса
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentCategories.map((cat) => {
                        const isSel = activeSelections.includes(cat.id);
                        const displayName = getDisplayName(cat.id, activeGrade);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(activeGrade, cat.id)}
                            className={cn(
                              'p-3 rounded-lg border text-left transition',
                              isSel
                                ? 'bg-purple-500/20 border-purple-500/50'
                                : 'border-white/10 hover:bg-white/5'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                                  isSel
                                    ? 'bg-purple-500 border-purple-500'
                                    : 'border-white/30'
                                )}
                              >
                                {isSel && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium">
                                  {displayName}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {cat.description}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-slate-400">
                      Нажми на класс, чтобы выбрать его предметы
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {GRADES.filter((g) => !selectedGrades.includes(g)).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => selectGrade(g)}
                          className="aspect-square rounded-2xl border border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/40 transition flex flex-col items-center justify-center gap-1 group"
                        >
                          <span className="text-3xl font-bold text-white group-hover:text-purple-200">
                            {g}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">
                            класс
                          </span>
                        </button>
                      ))}
                    </div>
                    {selectedGrades.length > 0 && (
                      <div className="text-xs text-slate-500 pt-1">
                        Нажми на чип вверху, чтобы изменить предметы класса, или
                        выбери ещё один класс.
                      </div>
                    )}
                  </div>
                )}

                {totalSelected > 0 && (
                  <div className="text-xs text-emerald-400 pt-2 border-t border-white/5">
                    Выбрано предметов: {totalSelected}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить заявку'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}