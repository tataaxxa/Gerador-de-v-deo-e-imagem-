import React from 'react';
import { UserEconomy } from '../types';
import { Sparkles, Coins, Flame, Gift, Crown, Video, Image as ImageIcon, LayoutGrid, Zap } from 'lucide-react';

interface NavbarProps {
  currentTab: 'image' | 'video' | 'gallery';
  setCurrentTab: (tab: 'image' | 'video' | 'gallery') => void;
  economy: UserEconomy;
  onOpenCheckin: () => void;
  onOpenRoleta: () => void;
  onOpenMissions: () => void;
  onOpenPlans: () => void;
  onEmergencyRefill: () => void;
  claimableMissionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  economy,
  onOpenCheckin,
  onOpenRoleta,
  onOpenMissions,
  onOpenPlans,
  onEmergencyRefill,
  claimableMissionsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Google AI Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('image')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-yellow-500/20 text-2xl animate-pulse">
              🍌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-yellow-300 via-amber-200 to-white bg-clip-text text-transparent">
                  Nano Banana 2.1
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Veo 3.1
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Google AI Creative Studio</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setCurrentTab('image')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'image'
                  ? 'bg-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/20 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Nano Banana Imagens</span>
            </button>

            <button
              onClick={() => setCurrentTab('video')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'video'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Video className="w-4 h-4 text-purple-400" />
              <span>Vídeos Veo 3.1</span>
            </button>

            <button
              onClick={() => setCurrentTab('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'gallery'
                  ? 'bg-zinc-800 text-yellow-400 border border-yellow-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Galeria Local</span>
            </button>
          </nav>

          {/* Economy, Check-in, Roleta, Quests & Plans */}
          <div className="flex items-center gap-2">
            {/* Banana Credits counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/30 shadow-inner">
              <span className="text-base">🍌</span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-amber-300 leading-none">
                  {economy.isVip && economy.vipPlanName === 'ultra' ? '∞ ILIMITADO' : economy.credits}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 leading-none">
                  Créditos
                </span>
              </div>

              {/* Quick refill if credits low */}
              {economy.credits < 30 && !economy.isVip && (
                <button
                  onClick={onEmergencyRefill}
                  title="Recarga de emergência (+100 créditos)"
                  className="ml-1 p-1 rounded-md bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 transition"
                >
                  <Zap className="w-3 h-3 animate-bounce" />
                </button>
              )}
            </div>

            {/* Daily Check-in & Games Calendar */}
            <button
              onClick={onOpenCheckin}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-amber-500/40 hover:border-amber-400 transition text-xs font-bold"
              title="Calendário de Check-in Diário e Mini-Jogos"
            >
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="hidden sm:inline">Jogos & Calendário</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black">
                D{economy.checkinStreak > 0 ? economy.checkinStreak : 1}
              </span>
            </button>

            {/* Roleta da Sorte */}
            <button
              onClick={onOpenRoleta}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-yellow-600/30 hover:from-amber-600/50 hover:to-yellow-600/50 text-yellow-300 border border-yellow-500/40 transition text-xs font-semibold"
              title="Roleta da Sorte"
            >
              <Gift className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">Roleta</span>
              {economy.freeSpinsLeft > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-400 text-zinc-950 text-[10px] font-black flex items-center justify-center">
                  {economy.freeSpinsLeft}
                </span>
              )}
            </button>

            {/* Missões / Quests */}
            <button
              onClick={onOpenMissions}
              className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              title="Missões e Desafios"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              {claimableMissionsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {claimableMissionsCount}
                </span>
              )}
            </button>

            {/* VIP Plans button */}
            <button
              onClick={onOpenPlans}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shadow-sm ${
                economy.isVip
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 shadow-yellow-500/20'
                  : 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40'
              }`}
              title="Planos VIP 100% Gratuitos"
            >
              <Crown className={`w-3.5 h-3.5 ${economy.isVip ? 'text-zinc-950 fill-zinc-950' : 'text-yellow-400'}`} />
              <span className="hidden sm:inline">{economy.isVip ? 'VIP Ativo 👑' : 'VIP Grátis'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-900 text-xs">
          <button
            onClick={() => setCurrentTab('image')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg ${
              currentTab === 'image' ? 'bg-yellow-500 text-zinc-950 font-bold' : 'text-zinc-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Imagens</span>
          </button>
          <button
            onClick={() => setCurrentTab('video')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg ${
              currentTab === 'video' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Veo 3.1</span>
          </button>
          <button
            onClick={() => setCurrentTab('gallery')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg ${
              currentTab === 'gallery' ? 'bg-zinc-800 text-yellow-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Galeria</span>
          </button>
        </div>
      </div>
    </header>
  );
};
