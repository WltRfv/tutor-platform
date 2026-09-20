'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoriesForGrade } from '@/lib/subjects';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    grade: 7,
    phone: '',
  });

  // Категории, доступные для выбранного класса
  const availableCategories = getCategoriesForGrade(form.grade);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  // Сброс выбранных, если сменился класс и категория недоступна
  const handleGradeChange = (newGrade: number) => {
    const valid = getCategoriesForGrade(newGrade).map((c) => c.id);
    setSelected((prev) => prev.filter((id) => valid.includes(id)));
    setForm({ ...form, grade: newGrade });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return toast.error('Выбери хотя бы один предмет');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, categories: selected }),
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
      <Card className="w-full max-w-lg">
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
            <div>
              <Label>Класс</Label>
              <select
                value={form.grade}
                onChange={(e) => handleGradeChange(Number(e.target.value))}
                className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
              >
                {[5, 6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>
                    {g} класс
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Telegram / WhatsApp для связи</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="@username или +7..."
                required
              />
            </div>

            <div>
              <Label className="mb-2 block">
                Что хочешь изучать? (нельзя изменить после одобрения)
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {availableCategories.map((cat) => {
                  const isSelected = selected.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggle(cat.id)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition flex items-start gap-3',
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'border-white/10 hover:bg-white/5'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5',
                          isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-white/30'
                        )}
                      >
                        {isSelected && (
                          <span className="text-white text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">
                          {cat.label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {cat.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
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