import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Mission } from '../types';
import { creditsManager } from '../services/credits';
import { Sparkles, X, Check, Gift, Trophy, ArrowRight } from 'lucide-react';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'achievement'>('daily');

  if (!isOpen) return null;

  const filteredMissions = missions.filter((m) => m.category === activeTab);

  const handleClaim = (missionId: string) => {
    const reward = creditsManager.claimMissionReward(missionId);
    if (reward > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-blue-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Desafios & Conquistas</span>
          </div>
          <h2 className="text-xl font-black text-white">Missões de Créditos Banana</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cumpra tarefas criativas para recarregar sua conta com créditos gratuitos todos os dias!
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-4">
          <button
            onClick={() => setActiveTab('daily')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'daily'
                ? 'bg-zinc-800 text-yellow-400 border border-yellow-500/30 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Missões Diárias
          </button>
          <button
            onClick={() => setActiveTab('achievement')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'achievement'
                ? 'bg-zinc-800 text-yellow-400 border border-yellow-500/30 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Conquistas de Mestre
          </button>
        </div>

        {/* Mission List */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {filteredMissions.map((m) => {
            const isDone = m.progress >= m.totalRequired;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  m.isClaimed
                    ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                    : isDone
                    ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-400/60 shadow-md'
                    : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{m.title}</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{m.description}</p>
                  </div>

                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-black">
                    +{m.rewardCredits} 🍌
                  </span>
                </div>

                {/* Progress bar and action */}
                <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-zinc-800/80">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Progresso</span>
                      <span>
                        {m.progress} / {m.totalRequired}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (m.progress / m.totalRequired) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {m.isClaimed ? (
                    <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Resgatado</span>
                    </span>
                  ) : isDone ? (
                    <button
                      onClick={() => handleClaim(m.id)}
                      className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black shadow-md animate-pulse transition"
                    >
                      Resgatar +{m.rewardCredits}
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-zinc-500">Em andamento</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
