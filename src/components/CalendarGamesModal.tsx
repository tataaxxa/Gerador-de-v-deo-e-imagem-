import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar as CalendarIcon,
  Flame,
  Gift,
  Play,
  Trophy,
  X,
  Check,
  Sparkles,
  Zap,
  Gamepad2,
  Tv,
  Crown,
  RotateCw,
  Coins,
  Smile,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { creditsManager } from '../services/credits';
import { UserEconomy } from '../types';

interface CalendarGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoleta: () => void;
  onOpenPlans: () => void;
}

const MONTH_DAYS_COUNT = 30;

const STREAK_MILESTONES = [
  { day: 1, reward: 80, icon: '🍌', label: 'Início' },
  { day: 2, reward: 100, icon: '⚡', label: 'Ritmo' },
  { day: 3, reward: 150, icon: '🌟', label: 'Bônus' },
  { day: 4, reward: 180, icon: '🔥', label: 'Fogo' },
  { day: 5, reward: 220, icon: '💎', label: 'Precioso' },
  { day: 6, reward: 300, icon: '🚀', label: 'Super' },
  { day: 7, reward: 750, icon: '👑', label: 'Mega Baú 7 Dias', isMega: true },
];

export const CalendarGamesModal: React.FC<CalendarGamesModalProps> = ({
  isOpen,
  onClose,
  onOpenRoleta,
  onOpenPlans,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'scratch' | 'memory' | 'ad'>('calendar');
  const [economy, setEconomy] = useState<UserEconomy>(creditsManager.getEconomy());
  const [checkinFeedback, setCheckinFeedback] = useState<string | null>(null);

  // Scratch card state
  const [scratched, setScratched] = useState<boolean[]>([false, false, false]);
  const [scratchPrizes, setScratchPrizes] = useState<number[]>([100, 150, 250]);
  const [scratchWon, setScratchWon] = useState<number | null>(null);

  // Memory game state
  const [memoryCards, setMemoryCards] = useState<
    { id: number; symbol: string; isFlipped: boolean; isMatched: boolean }[]
  >([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryWon, setMemoryWon] = useState(false);

  // Watch Ad state
  const [adPlaying, setAdPlaying] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const [adRewardClaimed, setAdRewardClaimed] = useState(false);

  useEffect(() => {
    const unsub = creditsManager.subscribeEconomy((eco) => setEconomy(eco));
    return () => unsub();
  }, []);

  // Initialize Memory Game
  const initMemoryGame = () => {
    const symbols = ['🍌', '🎬', '💎', '🚀'];
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, idx) => ({
        id: idx,
        symbol,
        isFlipped: false,
        isMatched: false,
      }));
    setMemoryCards(deck);
    setFlippedCards([]);
    setMemoryWon(false);
  };

  useEffect(() => {
    if (activeTab === 'memory' && memoryCards.length === 0) {
      initMemoryGame();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const alreadyClaimedToday = economy.lastCheckinDate === today;
  const currentStreak = economy.checkinStreak;
  const currentDayIndex = (currentStreak - (alreadyClaimedToday ? 1 : 0)) % 7;

  // Handle Daily Checkin
  const handleCheckin = () => {
    const res = creditsManager.performDailyCheckin();
    setCheckinFeedback(res.message);

    if (res.success) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  // Scratch Card Logic
  const handleScratchCard = (index: number) => {
    if (scratched[index] || scratchWon !== null) return;

    const nextScratched = [...scratched];
    nextScratched[index] = true;
    setScratched(nextScratched);

    // If all 3 are scratched
    if (nextScratched.every((s) => s)) {
      const total = scratchPrizes.reduce((a, b) => a + b, 0);
      setScratchWon(total);
      creditsManager.addCredits(total, 'Raspadinha da Sorte Banana');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const resetScratch = () => {
    const prizes = [
      [50, 100, 150],
      [75, 125, 200],
      [100, 200, 300],
      [150, 250, 500],
    ][Math.floor(Math.random() * 4)];

    setScratchPrizes(prizes.sort(() => Math.random() - 0.5));
    setScratched([false, false, false]);
    setScratchWon(null);
  };

  // Memory Card Click
  const handleMemoryCardClick = (id: number) => {
    if (flippedCards.length === 2 || memoryCards[id].isFlipped || memoryCards[id].isMatched) {
      return;
    }

    const newCards = memoryCards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setMemoryCards(newCards);
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      if (newCards[firstId].symbol === newCards[secondId].symbol) {
        // Match!
        setTimeout(() => {
          const matchedCards = newCards.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          );
          setMemoryCards(matchedCards);
          setFlippedCards([]);

          if (matchedCards.every((c) => c.isMatched)) {
            setMemoryWon(true);
            creditsManager.addCredits(200, 'Jogo da Memória Neural');
            confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setMemoryCards(
            newCards.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  // Watch Ad logic
  const handleStartAd = () => {
    setAdPlaying(true);
    setAdTimer(5);
    setAdRewardClaimed(false);

    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdPlaying(false);
          setAdRewardClaimed(true);
          creditsManager.addCredits(75, 'Vídeo Premiado / Anúncio Patrocinado');
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-yellow-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Glows */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Title & Live Credits */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-black uppercase mb-1">
              <Gamepad2 className="w-3.5 h-3.5 text-yellow-400" />
              <span>Centro de Jogos & Calendário Diário</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ganhe Créditos Todos os Dias! 🍌
            </h2>
            <p className="text-xs text-zinc-400">
              Faça check-in no calendário, jogue mini-jogos ou assista anúncios para recargas ilimitadas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-yellow-500/40 shadow-inner">
              <span className="text-lg">🍌</span>
              <div className="text-left">
                <div className="text-xs font-black text-yellow-400">{economy.credits}</div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-400">Créditos</div>
              </div>
            </div>

            <button
              onClick={onOpenPlans}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-zinc-950 text-xs font-black transition shadow-md flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 text-zinc-950" />
              <span>VIP Grátis</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
              activeTab === 'calendar'
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/10'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <span>Calendário Check-in</span>
          </button>

          <button
            onClick={() => setActiveTab('scratch')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
              activeTab === 'scratch'
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/10'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Raspadinha da Sorte</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
              activeTab === 'memory'
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/10'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>Jogo da Memória</span>
          </button>

          <button
            onClick={() => setActiveTab('ad')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
              activeTab === 'ad'
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/10'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Tv className="w-4 h-4 text-emerald-400" />
            <span>Assistir Anúncio (+75)</span>
          </button>
        </div>

        {/* TAB 1: CALENDÁRIO CHECK-IN */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Streak Hero Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
                  🔥
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">Sequência Atual: {currentStreak} Dias</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase">
                      Ativo
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Faça check-in diário consecutivo para destravar o Mega Baú de 750 créditos!
                  </p>
                </div>
              </div>

              <button
                onClick={handleCheckin}
                disabled={alreadyClaimedToday}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-black transition shadow-lg flex items-center justify-center gap-2 ${
                  alreadyClaimedToday
                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-default'
                    : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-zinc-950 shadow-yellow-500/25 active:scale-95'
                }`}
              >
                {alreadyClaimedToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Check-in de Hoje Concluído!</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Fazer Check-in de Hoje (+Créditos)</span>
                  </>
                )}
              </button>
            </div>

            {checkinFeedback && (
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-300 text-xs font-bold text-center">
                {checkinFeedback}
              </div>
            )}

            {/* 7-Day Progressive Rewards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Trilha de Recompensas de 7 Dias
                </span>
                <span className="text-xs text-zinc-500">Reinicia a cada semana completa</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {STREAK_MILESTONES.map((item, idx) => {
                  const isCompleted = idx < currentDayIndex;
                  const isToday = idx === currentDayIndex;

                  return (
                    <div
                      key={item.day}
                      className={`relative rounded-2xl p-3 flex flex-col items-center justify-between text-center border transition-all ${
                        isCompleted
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                          : isToday
                          ? 'bg-gradient-to-b from-yellow-500/20 to-amber-500/10 border-yellow-400 text-yellow-300 shadow-lg shadow-yellow-500/20 scale-105'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-500'
                      } ${item.isMega ? 'col-span-2 sm:col-span-1 border-amber-400' : ''}`}
                    >
                      {isCompleted && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Dia {item.day}
                      </span>
                      <span className="text-2xl my-1">{item.icon}</span>
                      <span className="text-xs font-black text-white">+{item.reward}</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5 truncate w-full">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly 30-Day Interactive Calendar Grid */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                  Presença Mensal (30 Dias)
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Dia do Mês: {new Date().getDate()}/30
                </span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {Array.from({ length: MONTH_DAYS_COUNT }).map((_, i) => {
                  const dayNum = i + 1;
                  const currentMonthDay = new Date().getDate();
                  const isPast = dayNum < currentMonthDay;
                  const isCurrentDay = dayNum === currentMonthDay;
                  const isChestDay = dayNum % 7 === 0;

                  return (
                    <div
                      key={dayNum}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center border text-[11px] font-bold transition ${
                        isCurrentDay
                          ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 ring-2 ring-yellow-400/20 scale-105'
                          : isPast
                          ? 'bg-zinc-900 border-emerald-500/40 text-emerald-400'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
                      }`}
                    >
                      <span className="text-[9px]">{dayNum}</span>
                      <span className="text-xs">{isChestDay ? '🎁' : isPast ? '✓' : '🍌'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RASPADINHA DA SORTE */}
        {activeTab === 'scratch' && (
          <div className="space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-black text-white">Raspadinha da Sorte Banana 🃏</h3>
              <p className="text-xs text-zinc-400">
                Clique nas 3 cartas abaixo para raspar e revelar prêmios instantâneos de até +500 créditos!
              </p>
            </div>

            {/* 3 Scratch Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-lg mx-auto">
              {scratched.map((isScratched, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleScratchCard(idx)}
                  className={`h-36 sm:h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-3 transition-all ${
                    isScratched
                      ? 'bg-gradient-to-b from-yellow-500/20 via-zinc-900 to-zinc-950 border-yellow-400 text-yellow-300 scale-100 shadow-xl'
                      : 'bg-gradient-to-br from-amber-600/40 to-yellow-600/20 hover:from-amber-600/60 hover:to-yellow-600/40 border-yellow-500/60 hover:scale-105 cursor-pointer shadow-lg active:scale-95'
                  }`}
                >
                  {isScratched ? (
                    <div className="space-y-1 animate-in zoom-in-75">
                      <span className="text-3xl sm:text-4xl">🍌</span>
                      <div className="text-base sm:text-xl font-black text-white">
                        +{scratchPrizes[idx]}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-yellow-400">Créditos</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-2xl sm:text-3xl">✨</span>
                      <div className="text-xs font-black uppercase tracking-wider text-yellow-300">
                        Raspar Aqui
                      </div>
                      <div className="text-[10px] text-zinc-400">Carta #{idx + 1}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {scratchWon !== null && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl max-w-md mx-auto space-y-2 animate-in zoom-in-95">
                <div className="text-base font-black text-yellow-300">
                  🎉 Parabéns! Você ganhou +{scratchWon} Créditos Banana!
                </div>
                <button
                  onClick={resetScratch}
                  className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black transition"
                >
                  Jogar Novamente 🔄
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JOGO DA MEMÓRIA */}
        {activeTab === 'memory' && (
          <div className="space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-black text-white">Jogo da Memória Neural 🧠</h3>
              <p className="text-xs text-zinc-400">
                Encontre todos os 4 pares de cartas com símbolos Google AI para ganhar +200 créditos instantâneos!
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {memoryCards.map((card) => {
                const isVisible = card.isFlipped || card.isMatched;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleMemoryCardClick(card.id)}
                    disabled={card.isMatched}
                    className={`h-20 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl transition-all ${
                      card.isMatched
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 opacity-90'
                        : isVisible
                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 scale-100 shadow-md'
                        : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-500 hover:border-yellow-500/50 cursor-pointer active:scale-95'
                    }`}
                  >
                    {isVisible ? card.symbol : '❓'}
                  </button>
                );
              })}
            </div>

            {memoryWon && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl max-w-md mx-auto space-y-2 animate-in zoom-in-95">
                <div className="text-base font-black text-emerald-300">
                  🏆 Vitória! Todos os pares encontrados! +200 Créditos adicionados.
                </div>
                <button
                  onClick={initMemoryGame}
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-black transition"
                >
                  Jogar Outra Partida 🔄
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ASSISTIR ANÚNCIO PREMIADO */}
        {activeTab === 'ad' && (
          <div className="space-y-6 text-center max-w-lg mx-auto">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Vídeo Premiado / Anúncio Patrocinado 📺</h3>
              <p className="text-xs text-zinc-400">
                Assista a um breve vídeo patrocinado de 5 segundos para receber +75 Créditos Banana imediatamente! Sem limites de vezes.
              </p>
            </div>

            <div className="relative p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
              {adPlaying ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 flex items-center justify-center text-3xl mx-auto animate-bounce shadow-lg shadow-yellow-500/30">
                    🍌
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-black text-white">Anúncio em Exibição...</div>
                    <div className="text-xs text-yellow-300 font-bold">
                      Ganhando +75 Créditos em {adTimer} segundos
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${((5 - adTimer) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ) : adRewardClaimed ? (
                <div className="space-y-3 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-2xl mx-auto">
                    ✓
                  </div>
                  <div className="text-base font-black text-emerald-300">
                    Recompensa de +75 Créditos Resgatada com Sucesso!
                  </div>
                  <button
                    onClick={handleStartAd}
                    className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black transition shadow-md"
                  >
                    Assistir Outro Anúncio (+75 Créditos) 📺
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl mx-auto">
                    🎬
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Vídeo Patrocinado Google AI Partners</div>
                    <div className="text-xs text-zinc-400 mt-1">Duração: apenas 5 segundos</div>
                  </div>
                  <button
                    onClick={handleStartAd}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Anúncio e Ganhar +75 Créditos</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer shortcuts */}
        <div className="mt-8 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Mais opções de créditos:</span>
            <button
              onClick={() => {
                onClose();
                onOpenRoleta();
              }}
              className="text-yellow-400 hover:underline font-bold"
            >
              🎰 Roleta da Sorte
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenPlans();
            }}
            className="text-amber-300 hover:underline font-bold flex items-center gap-1"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Ativar Plano VIP Grátis (Créditos Ilimitados)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
