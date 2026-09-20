'use client';
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { motion } from 'framer-motion';
import {
  X,
  Video,
  PenTool,
  ExternalLink,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  BookOpen,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarEvent = {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  backgroundColor?: string;
  extendedProps?: {
    telemostLink?: string | null;
    boardLink?: string | null;
    subjectName?: string;
    userName?: string;
    role?: 'teacher' | 'student';
    editUrl?: string;
  };
};

export function CalendarView({
  events,
  initialView = 'timeGridWeek',
}: {
  events: CalendarEvent[];
  initialView?: 'timeGridWeek' | 'dayGridMonth';
}) {
  const [view, setView] = useState<'timeGridWeek' | 'dayGridMonth'>(initialView);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
      {/* Переключатель */}
      <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {[
          { id: 'timeGridWeek' as const, label: '📅 Неделя' },
          { id: 'dayGridMonth' as const, label: '🗓 Месяц' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={cn(
              'relative px-4 py-2 rounded-lg text-sm font-medium transition',
              view === v.id ? 'text-white' : 'text-slate-400 hover:text-white'
            )}
          >
            {view === v.id && (
              <motion.div
                layoutId="cal-view"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/40 to-blue-500/40"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Календарь */}
      <div className="calendar-wrapper">
        <FullCalendar
          key={view}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          locale={ruLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            backgroundColor: e.backgroundColor || '#a855f7',
            borderColor: e.backgroundColor || '#a855f7',
            textColor: '#ffffff',
          }))}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          dayMaxEvents={4}
          nowIndicator
          firstDay={1}
          eventDisplay="block"
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            const event = events.find((e) => e.id === info.event.id);
            if (event) setSelectedEvent(event);
          }}
        />
      </div>

      {/* Модальное окно */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md backdrop-blur-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div
              className="h-2"
              style={{ background: selectedEvent.backgroundColor || '#a855f7' }}
            />

            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 pr-8">
                {selectedEvent.title}
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CalendarIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  <span>
                    {new Date(selectedEvent.start).toLocaleDateString('ru-RU', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Clock className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  <span>
                    {new Date(selectedEvent.start).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                    {' — '}
                    {new Date(selectedEvent.end).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>

                {selectedEvent.extendedProps?.subjectName && (
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <BookOpen className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <span>{selectedEvent.extendedProps.subjectName}</span>
                  </div>
                )}

                {selectedEvent.extendedProps?.userName && (
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <UserIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <span>{selectedEvent.extendedProps.userName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {selectedEvent.extendedProps?.telemostLink && (
                  <a
                    href={selectedEvent.extendedProps.telemostLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium transition shadow-lg shadow-emerald-500/20"
                  >
                    <Video className="h-4 w-4" />
                    Открыть Телемост
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                )}

                {selectedEvent.extendedProps?.boardLink && (
                  <a
                    href={selectedEvent.extendedProps.boardLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium transition shadow-lg shadow-purple-500/20"
                  >
                    <PenTool className="h-4 w-4" />
                    Открыть Доску
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                )}

                {selectedEvent.extendedProps?.role === 'teacher' &&
                  selectedEvent.extendedProps.editUrl && (
                    <a
                      href={selectedEvent.extendedProps.editUrl}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition"
                    >
                      <Edit className="h-4 w-4" />
                      Редактировать занятие
                    </a>
                  )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Стили */}
      <style jsx global>{`
        .calendar-wrapper .fc {
          color: #e2e8f0;
          font-family: inherit;
        }
        .calendar-wrapper .fc-theme-standard .fc-scrollgrid {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px;
          overflow: hidden;
        }
        .calendar-wrapper .fc-theme-standard td,
        .calendar-wrapper .fc-theme-standard th {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .calendar-wrapper .fc-col-header-cell {
          background: rgba(255, 255, 255, 0.03);
          padding: 10px 0;
        }
        .calendar-wrapper .fc-col-header-cell-cushion {
          color: #94a3b8 !important;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          text-decoration: none !important;
          padding: 4px 8px;
        }
        .calendar-wrapper .fc-timegrid-slot {
          height: 48px;
        }
        .calendar-wrapper .fc-timegrid-slot-label-cushion {
          color: #64748b !important;
          font-size: 11px;
          font-weight: 500;
        }
        .calendar-wrapper .fc-timegrid-axis {
          background: rgba(255, 255, 255, 0.02);
        }
        .calendar-wrapper .fc-day-today {
          background: rgba(168, 85, 247, 0.08) !important;
        }
        .calendar-wrapper .fc-event {
          border-radius: 6px !important;
          padding: 3px 8px !important;
          font-size: 12px !important;
          font-weight: 500;
          cursor: pointer;
          border: none !important;
        }
        .calendar-wrapper .fc-event:hover {
          opacity: 0.85;
        }
        .calendar-wrapper .fc-toolbar {
          margin-bottom: 16px !important;
          gap: 8px;
        }
        .calendar-wrapper .fc-toolbar-title {
          font-size: 18px !important;
          font-weight: 600;
          color: #ffffff;
          text-transform: capitalize;
        }
        .calendar-wrapper .fc-button {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 7px 14px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          text-transform: capitalize !important;
          box-shadow: none !important;
          transition: all 0.15s ease !important;
          height: auto !important;
          cursor: pointer !important;
        }
        .calendar-wrapper .fc-button:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }
        .calendar-wrapper .fc-button:focus {
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.3) !important;
          outline: none !important;
        }
        .calendar-wrapper .fc-button:disabled {
          opacity: 0.4 !important;
        }
        .calendar-wrapper .fc-button-active {
          background: rgba(168, 85, 247, 0.3) !important;
          border-color: rgba(168, 85, 247, 0.5) !important;
        }
        .calendar-wrapper .fc-daygrid-day-number {
          color: #cbd5e1 !important;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 8px;
          text-decoration: none !important;
        }
        .calendar-wrapper .fc-day-sat .fc-col-header-cell-cushion,
        .calendar-wrapper .fc-day-sun .fc-col-header-cell-cushion {
          color: #f87171 !important;
        }
        .calendar-wrapper .fc-timegrid-now-indicator-line {
          border-color: #ef4444 !important;
          border-width: 2px !important;
        }
        .calendar-wrapper .fc-scroller::-webkit-scrollbar {
          width: 6px;
        }
        .calendar-wrapper .fc-scroller::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}