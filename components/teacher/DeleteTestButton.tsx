'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteTestButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/tests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка при удалении');
      toast.success('Тест удалён');
      router.push('/teacher/content');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition ${
        confirm
          ? 'bg-red-500/20 border-red-500/50 text-red-300'
          : 'border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30'
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {confirm ? 'Точно удалить?' : 'Удалить'}
    </button>
  );
}