'use client';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

type NotifItem = {
  type: string;
  count: number;
  label: string;
  href: string;
};

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Пересчёт позиции при открытии и ресайзе
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const update = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.right + 8 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 250);
  };

  const handleClick = async (item: NotifItem) => {
    setOpen(false);
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type }),
      });
    } catch {}
    router.push(item.href);
    router.refresh();
    setTimeout(load, 300);
  };

  const total = items.reduce((sum, i) => sum + i.count, 0);

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -5, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -5, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 99999,
          }}
          className="w-72 backdrop-blur-xl bg-slate-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Уведомления</span>
            <span className="text-[10px] text-slate-500">Обновлено: сейчас</span>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Нет новых уведомлений
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleClick(item)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition text-left"
                >
                  <span className="text-sm text-slate-200">{item.label}</span>
                  <span className="min-w-[24px] h-6 px-2 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {mounted && createPortal(dropdown, document.body)}
    </div>
  );
}