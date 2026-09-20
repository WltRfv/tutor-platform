'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { X, Loader2, RefreshCw } from 'lucide-react';

export function RetakeRequestModal({
  testId,
  onClose,
}: {
  testId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/retake-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Запрос отправлен учителю');
      onClose();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md backdrop-blur-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Запрос на пересдачу</h3>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Учитель увидит запрос и решит, разрешить ли повторное прохождение.
        </p>

        <label className="text-xs text-slate-400 mb-2 block">
          Причина (необязательно)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Например: Хочу улучшить результат"
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm resize-y focus:outline-none focus:border-amber-500/50 mb-4"
        />

        <div className="flex gap-2">
          <Button
            onClick={submit}
            disabled={loading}
            className="flex-1 gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loading ? 'Отправка...' : 'Отправить запрос'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/20 text-slate-300"
          >
            Отмена
          </Button>
        </div>
      </motion.div>
    </div>
  );
}