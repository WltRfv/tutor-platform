'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUBJECTS = [
  { value: 'MATH_5_6', label: 'Математика 5–6' },
  { value: 'ALGEBRA_7_9', label: 'Алгебра 7–9' },
  { value: 'GEOMETRY_7_9', label: 'Геометрия 7–9' },
  { value: 'OGE_PREP', label: 'Подготовка к ОГЭ' },
  { value: 'VPR_PREP', label: 'Подготовка к ВПР' },
  { value: 'INFORMATICS', label: 'Информатика' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', grade: 7, phone: '' });

  const toggle = (v: string) =>
    setSelected((prev) => (prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return toast.error('Выберите хотя бы один предмет');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subjects: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Заявка отправлена! Ожидайте одобрения учителя.');
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
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <Label>Класс</Label>
              <Input type="number" min={1} max={11} value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })} required />
            </div>
            <div>
                <Label>Telegram / Вконтакте для связи</Label>
                <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="@username или +7..."
                    required
                    minLength={3}
                />
            </div>
            <div>
              <Label className="mb-2 block">Предметы (нельзя изменить после одобрения)</Label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggle(s.value)}
                    className={`p-2 rounded-lg border text-sm transition ${
                      selected.includes(s.value) ? 'bg-purple-500 text-white border-purple-500' : 'hover:bg-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
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