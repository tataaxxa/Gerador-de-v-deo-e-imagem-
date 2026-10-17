import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { creditsManager } from '../services/credits';
import { Flame, X, Check, Gift, Sparkles, Trophy } from 'lucide-react';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkinStreak: number;
  lastCheckinDate: string;
}

const STREAK_DAYS = [
  { day: 1, credits: 50, icon: '🍌' },
  { day: 2, credits: 75, icon: '🍌' },
  { day: 3, credits: 100, icon: '⚡' },
  { day: 4, credits: 120, icon: '🍌' },
  { day: 5, credits: 150, icon: '🌟' },
  { day: 6, credits: 200, icon: '🔥' },
  { day: 7, credits: 500, icon: '👑', isMega: true },
];

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({
  isOpen,
  onClose,
  checkinStreak,
  lastCheckinDate,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const alreadyClaimed = lastCheckinDate === today;
  const currentDayIndex = ((checkinStreak - (alreadyClaimed ? 1 : 0)) % 7);

  const handleClaim = () => {
    const res = creditsManager.performDailyCheckin();
    setFeedback(res.message);

    if (res.success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center text-center">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>Check-in Diário Contínuo</span>
          </div>
          <h2 className="text-2xl font-black text-white">Recompensas Diárias em Sequência</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Volte todos os dias para aumentar sua sequência e desbloquear até 500 créditos extras e giros de roleta!
          </p>
        </div>

        {/* Streak Grid 7 Days */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 w-full mb-6">
          {STREAK_DAYS.map((item, idx) => {
            const isCompleted = idx < currentDayIndex;
            const isToday = idx === currentDayIndex;

            return (
              <div
                key={item.day}
                className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between border transition-all ${
                  isCompleted
                    ? 'bg-zinc-800/80 border-emerald-500/50 text-emerald-400'
                    : isToday
                    ? 'bg-gradient-to-b from-yellow-500/20 to-amber-500/10 border-yellow-400 text-yellow-300 shadow-lg shadow-yellow-500/20 scale-105'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                } ${item.isMega ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                {/* Completed badge */}
                {isCompleted && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                <span className="text-[10px] font-bold uppercase text-zinc-400">Dia {item.day}</span>
                <span className="text-xl my-1">{item.icon}</span>
                <span className="text-xs font-black text-white">+{item.credits}</span>
              </div>
            );
          })}
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="w-full mb-4 p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-semibold">
            {feedback}
          </div>
        )}

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={alreadyClaimed}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition ${
            alreadyClaimed
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              : 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-zinc-950 shadow-yellow-500/25 active:scale-[0.99]'
          }`}
        >
          {alreadyClaimed ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Recompensa de Hoje já Resgatada!</span>
            </>
          ) : (
            <>
              <Gift className="w-4 h-4 text-zinc-950" />
              <span>Resgatar Recompensa de Hoje</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
