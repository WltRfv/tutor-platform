'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

const Tldraw = dynamic(async () => (await import('tldraw')).Tldraw, {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-slate-400 flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        Загрузка доски...
      </div>
    </div>
  ),
});

export function HomeworkBoard({
  onSave,
}: {
  onSave: (data: { boardData: any; previewUrl: string }) => Promise<void> | void;
  initialData?: any;
}) {
  const [editor, setEditor] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const boardData = editor.store.getStoreSnapshot();
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      let previewUrl = '';
      if (shapeIds.length > 0) {
        const result = await editor.toImage(shapeIds, {
          format: 'png',
          background: true,
          padding: 20,
        });
        if (result?.blob) {
          previewUrl = await blobToDataUrl(result.blob);
        }
      }
      await onSave({ boardData, previewUrl });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="relative w-full"
      style={{ height: '600px', isolation: 'isolate' }}
    >
      <div className="absolute inset-0">
        <Tldraw
          onMount={(ed) => setEditor(ed)}
          colorScheme="dark"
        />
      </div>

      <div className="absolute bottom-4 right-4 z-[999]">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Сохранение...' : 'Сохранить доску'}
        </Button>
      </div>
    </div>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}