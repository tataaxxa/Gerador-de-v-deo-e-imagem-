import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { creditsManager } from '../services/credits';
import { Gift, X, Sparkles, Trophy, Zap, AlertCircle } from 'lucide-react';

interface RoletaWheelProps {
  isOpen: boolean;
  onClose: () => void;
  freeSpins: number;
  userCredits: number;
}

const PRIZES = [
  { label: '+25 🍌', credits: 25, color: '#f59e0b', textColor: '#000' },
  { label: '+50 🍌', credits: 50, color: '#eab308', textColor: '#000' },
  { label: '+100 🍌', credits: 100, color: '#8b5cf6', textColor: '#fff' },
  { label: '+35 🍌', credits: 35, color: '#06b6d4', textColor: '#000' },
  { label: '+200 🍌', credits: 200, color: '#ec4899', textColor: '#fff' },
  { label: '+75 🍌', credits: 75, color: '#10b981', textColor: '#000' },
  { label: 'SUPER 500 🍌', credits: 500, color: '#f97316', textColor: '#fff', isJackpot: true },
  { label: '+40 🍌', credits: 40, color: '#3b82f6', textColor: '#fff' },
];

export const RoletaWheel: React.FC<RoletaWheelProps> = ({
  isOpen,
  onClose,
  freeSpins,
  userCredits,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ label: string; credits: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;

    if (freeSpins <= 0 && userCredits < 10) {
      setErrorMsg('Sem créditos suficientes para girar! Faça o check-in diário primeiro.');
      return;
    }

    setErrorMsg(null);
    setWonPrize(null);
    setIsSpinning(true);

    // Pick a random prize index
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIndex];

    // Compute rotation angle (each slice is 360 / 8 = 45 deg)
    const sliceAngle = 360 / PRIZES.length;
    // Add extra full turns (5-8 spins) + slice center offset
    const extraTurns = (5 + Math.floor(Math.random() * 4)) * 360;
    // Pointer is at the top (270 deg or 90 deg depending on canvas coordinate)
    const targetAngle = extraTurns + (PRIZES.length - prizeIndex - 0.5) * sliceAngle;

    const newRotation = rotation + targetAngle;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize);

      // Award credits
      creditsManager.spinRoleta(prize.credits);

      // Trigger Confetti!
      confetti({
        particleCount: prize.credits >= 100 ? 120 : 60,
        spread: 80,
        origin: { y: 0.6 },
      });
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-yellow-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-black uppercase mb-1">
            <Gift className="w-3.5 h-3.5" />
            <span>Roleta da Sorte Banana</span>
          </div>
          <h2 className="text-xl font-black text-white">Gire e Ganhe Créditos Grátis</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {freeSpins > 0 ? (
              <span className="text-yellow-400 font-bold">Você tem {freeSpins} giro(s) grátis hoje!</span>
            ) : (
              <span>Giro extra por apenas 10 créditos Banana</span>
            )}
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 my-4 flex items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400/80 shadow-[0_0_25px_rgba(250,204,21,0.4)] pointer-events-none" />

          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

          {/* Rotating Wheel SVG */}
          <div
            className="w-full h-full rounded-full overflow-hidden transition-transform ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '4.5s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.15, 0.99, 0.35, 1.0)',
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {PRIZES.map((prize, i) => {
                const angle = 360 / PRIZES.length;
                const startAngle = (i * angle * Math.PI) / 180;
                const endAngle = (((i + 1) * angle) * Math.PI) / 180;
                const x1 = 50 + 50 * Math.cos(startAngle);
                const y1 = 50 + 50 * Math.sin(startAngle);
                const x2 = 50 + 50 * Math.cos(endAngle);
                const y2 = 50 + 50 * Math.sin(endAngle);

                // Text orientation
                const midAngle = (i + 0.5) * angle;

                return (
                  <g key={i}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color}
                      stroke="#18181b"
                      strokeWidth="0.8"
                    />
                    <text
                      x="78"
                      y="52"
                      fill={prize.textColor}
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      transform={`rotate(${midAngle}, 50, 50)`}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Hub */}
          <div className="absolute z-10 w-12 h-12 rounded-full bg-zinc-950 border-4 border-yellow-400 flex items-center justify-center text-lg shadow-xl">
            🍌
          </div>
        </div>

        {/* Won Prize Notification */}
        {wonPrize && (
          <div className="my-2 p-3 rounded-2xl bg-yellow-500/20 border border-yellow-400 text-yellow-300 animate-in zoom-in-95 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="text-xs font-bold">
              Parabéns! Você ganhou {wonPrize.label} na Roleta da Sorte!
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="my-2 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Spin Action Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-zinc-950 font-black text-sm shadow-xl shadow-yellow-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isSpinning ? (
            <span>Girando a Roleta... 🎰</span>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>GIRAR AGORA ({freeSpins > 0 ? 'GRÁTIS' : '-10 🍌'})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
