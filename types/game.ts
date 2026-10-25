// types/game.ts
export type GameType =
  | 'CARDS'
  | 'MATCHING'
  | 'FIND_ERROR'
  | 'QUIZ'
  | 'TRAINER'
  | 'HINTS'
  | 'QUEST';

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  CARDS: 'Карточки',
  MATCHING: 'Найди пару',
  FIND_ERROR: 'Найди ошибку',
  QUIZ: 'Викторина',
  TRAINER: 'Тренажёр',
  HINTS: 'Угадай по подсказкам',
  QUEST: 'Квест',
};

export const VALID_GAME_TYPES: GameType[] = [
  'CARDS', 'MATCHING', 'FIND_ERROR', 'QUIZ', 'TRAINER', 'HINTS', 'QUEST',
];

export type CardsPayload = { question: string; answer: string };
export type MatchingPayload = { left: string; right: string };
export type FindErrorPayload = {
  statement: string;
  hasError: boolean;
  correction?: string;
  explanation?: string;
};
export type QuizPayload = {
  text: string;
  options: string[];
  correct: number;
  explanation?: string;
};
export type HintsPayload = { answer: string; hints: string[] };

export type GameItemPayload =
  | CardsPayload
  | MatchingPayload
  | FindErrorPayload
  | QuizPayload
  | HintsPayload;

// ---- Безопасные парсеры (защита от «мусора» в Json-поле) ----

export function parseCardsPayload(p: unknown): CardsPayload {
  const o = (p ?? {}) as any;
  return { question: String(o.question ?? ''), answer: String(o.answer ?? '') };
}

export function parseMatchingPayload(p: unknown): MatchingPayload {
  const o = (p ?? {}) as any;
  return { left: String(o.left ?? ''), right: String(o.right ?? '') };
}

export function parseQuizPayload(p: unknown): QuizPayload {
  const o = (p ?? {}) as any;
  const options = Array.isArray(o.options) ? o.options.map(String) : [];
  const correct = Number.isInteger(o.correct) ? Number(o.correct) : 0;
  return {
    text: String(o.text ?? ''),
    options,
    correct: Math.max(0, Math.min(options.length - 1, correct)),
    explanation: o.explanation ? String(o.explanation) : undefined,
  };
}

export function parseHintsPayload(p: unknown): HintsPayload {
  const o = (p ?? {}) as any;
  return {
    answer: String(o.answer ?? ''),
    hints: Array.isArray(o.hints) ? o.hints.map(String) : [],
  };
}

export function parseFindErrorPayload(p: unknown): FindErrorPayload {
  const o = (p ?? {}) as any;
  return {
    statement: String(o.statement ?? ''),
    hasError: Boolean(o.hasError),
    correction: o.correction ? String(o.correction) : undefined,
    explanation: o.explanation ? String(o.explanation) : undefined,
  };
}