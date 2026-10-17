import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PLAN_TIERS, creditsManager } from '../services/credits';
import { Crown, X, Check, Zap, Sparkles, ShieldCheck } from 'lucide-react';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  isVip: boolean;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  isVip,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = (planId: string, planName: string) => {
    creditsManager.setPlan(planId);
    setSuccessMsg(`Plano ${planName} ativado com sucesso! Aproveite seus benefícios.`);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-yellow-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col">
        {/* Glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-8 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-black uppercase mb-2">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>Assinaturas & Planos VIP Banana 100% Gratuitos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Desbloqueie o Poder Máximo Sem Limites!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1">
            Escolha qualquer plano VIP <strong>gratuitamente</strong> para receber até +5.000 créditos imediatos, resolução 4K e gerações de vídeo Veo 3.1 ultra-rápidas!
          </p>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLAN_TIERS.map((tier) => {
            const isCurrent = (currentPlan === tier.id) || (!currentPlan && tier.id === 'free' && !isVip);

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-yellow-500/15 via-zinc-900 to-zinc-950 border-yellow-400 shadow-xl shadow-yellow-500/10 scale-105 z-10'
                    : 'bg-zinc-950/70 border-zinc-800'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-yellow-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow">
                    Mais Escolhido • 100% Grátis
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white">{tier.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-bold">
                      {tier.badge}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-black text-white">{tier.priceMonthly}</div>
                    <div className="text-xs text-yellow-400 font-bold mt-0.5">
                      {tier.creditsAllowance}
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-2.5 mb-6 text-xs text-zinc-300">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(tier.id, tier.name)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-default'
                      : tier.highlight
                      ? 'bg-yellow-400 hover:bg-yellow-300 text-zinc-950 shadow-yellow-500/20'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                  }`}
                >
                  {isCurrent ? (
                    <span>Plano Atual Ativo ✓</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>
                        {tier.id === 'ultra'
                          ? 'Ativar VIP Ultra Grátis (+5.000 Créditos)'
                          : tier.id === 'pro'
                          ? 'Ativar VIP Pro Grátis (+2.000 Créditos)'
                          : 'Selecionar Plano'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-[11px] text-zinc-500">
          Simulação de assinatura segura do Google AI Studio. Cancele ou altere seu plano quando desejar.
        </div>
      </div>
    </div>
  );
};
