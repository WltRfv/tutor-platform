'use client';
import { CardsGamePlayer } from './CardsGamePlayer';
import { MatchingGamePlayer } from './MatchingGamePlayer';
import { HintsGamePlayer } from './HintsGamePlayer';
import { FindErrorGamePlayer } from './FindErrorGamePlayer';
import { QuizGamePlayer } from './QuizGamePlayer';
import type { GameType } from '@/types/game';

type Props = { gameId: string; gameType: GameType; gameTitle: string };

export function GamePlayer({ gameId, gameType, gameTitle }: Props) {
  switch (gameType) {
    case 'CARDS':
      return <CardsGamePlayer gameId={gameId} gameTitle={gameTitle} />;
    case 'MATCHING':
      return <MatchingGamePlayer gameId={gameId} gameTitle={gameTitle} />;
    case 'HINTS':
      return <HintsGamePlayer gameId={gameId} gameTitle={gameTitle} />;
    case 'FIND_ERROR':
      return <FindErrorGamePlayer gameId={gameId} gameTitle={gameTitle} />;
    case 'QUIZ':
    case 'TRAINER':
      return <QuizGamePlayer gameId={gameId} gameTitle={gameTitle} />;
    default:
      return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
          Этот тип игры пока не поддерживается
        </div>
      );
  }
}