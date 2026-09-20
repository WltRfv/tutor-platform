'use client';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image as ImageIcon, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ImageUploader({
  value,
  onChange,
  label = 'Картинка',
  placeholder = 'Ссылка на картинку',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Файл больше 5 МБ');
    }
    if (!file.type.startsWith('image/')) {
      return toast.error('Только изображения');
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/teacher/upload-image', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
      toast.success('Картинка загружена');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-slate-400">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-slate-500 hover:text-purple-300 transition flex items-center gap-1"
        >
          <Link2 className="h-3 w-3" />
          {showUrlInput ? 'Скрыть URL' : 'Вставить URL'}
        </button>
      </div>

      {/* Превью */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950/50 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Превью"
            className="w-full h-auto max-h-64 object-contain"
            onError={() => toast.error('Не удалось загрузить картинку')}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition"
            title="Удалить"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* Кнопка загрузки */}
      {!value && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            disabled={uploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition',
              uploading
                ? 'border-purple-500/30 bg-purple-500/5 cursor-wait'
                : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                <span className="text-sm text-slate-300">Загрузка...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-300">
                  Загрузить картинку
                </span>
                <span className="text-xs text-slate-500">(до 5 МБ)</span>
              </>
            )}
          </button>
        </>
      )}

      {/* URL-инпут */}
      {showUrlInput && (
        <div className="mt-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-white/5 border-white/10 text-white text-sm"
          />
        </div>
      )}
    </div>
  );
}