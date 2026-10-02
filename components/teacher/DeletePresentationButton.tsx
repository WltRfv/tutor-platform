'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export function DeletePresentationButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    if (!confirm('Удалить презентацию и все слайды?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/presentations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка');
      toast.success('Удалено');
      router.push('/teacher/presentations');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-sm disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Удалить
    </button>
  );
}