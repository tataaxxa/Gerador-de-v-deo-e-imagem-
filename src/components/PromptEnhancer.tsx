import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Undo2,
  Columns,
  Check,
  Copy,
  ChevronDown,
  Info,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { enhancePromptDetails, EnhancePromptResult } from '../services/api';
import { creditsManager } from '../services/credits';

export type EnhanceMode = 'equilibrado' | 'fotorealista' | 'cinematografico' | 'fantasia' | 'video_dinamico';

interface PromptEnhancerProps {
  prompt: string;
  onChangePrompt: (newPrompt: string) => void;
  styleContext?: string;
  type?: 'image' | 'video';
  placeholder?: string;
  rows?: number;
  inspirationChips?: string[];
}

const MODES: { id: EnhanceMode; label: string; desc: string; icon: string; forVideoOnly?: boolean }[] = [
  {
    id: 'equilibrado',
    label: 'Equilibrado',
    desc: 'Expansão completa com harmonia visual e detalhes refinados',
    icon: '🌟',
  },
  {
    id: 'fotorealista',
    label: 'Fotorealista 8K',
    desc: 'Lente 85mm f/1.4, iluminação natural, texturas e profundidade',
    icon: '📸',
  },
  {
    id: 'cinematografico',
    label: 'Cinema 35mm',
    desc: 'Visual de Hollywood, luz volumétrica e color grading de filme',
    icon: '🎬',
  },
  {
    id: 'video_dinamico',
    label: 'Câmera em Movimento',
    desc: 'Dolly zoom suave, física de movimento e fluidez a 60fps',
    icon: '🎥',
  },
  {
    id: 'fantasia',
    label: 'Fantasia & Épico',
    desc: 'Aura mágica, partículas cintilantes e escala celestial',
    icon: '🌌',
  },
];

export const PromptEnhancer: React.FC<PromptEnhancerProps> = ({
  prompt,
  onChangePrompt,
  styleContext = 'fotorealista',
  type = 'image',
  placeholder = 'Descreva sua ideia em detalhes...',
  rows = 4,
  inspirationChips = [],
}) => {
  const [selectedMode, setSelectedMode] = useState<EnhanceMode>(
    type === 'video' ? 'video_dinamico' : 'equilibrado'
  );
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [history, setHistory] = useState<{ original: string; enhanced: string } | null>(null);
  const [lastResult, setLastResult] = useState<EnhancePromptResult | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const availableModes = MODES.filter((m) => !m.forVideoOnly || type === 'video');

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;

    setIsEnhancing(true);
    const originalText = prompt;

    try {
      const result = await enhancePromptDetails({
        prompt: originalText,
        style: styleContext,
        type,
        mode: selectedMode,
      });

      setHistory({
        original: originalText,
        enhanced: result.enhancedPrompt,
      });
      setLastResult(result);
      onChangePrompt(result.enhancedPrompt);

      try {
        creditsManager.advanceMission('enhance_prompt', 1);
      } catch (e) {
        // Safe check
      }
    } catch (err) {
      console.error('Erro ao aprimorar prompt:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndo = () => {
    if (history?.original) {
      onChangePrompt(history.original);
      setHistory(null);
      setLastResult(null);
      setShowCompare(false);
    }
  };

  const handleCopy = () => {
    if (!prompt.trim()) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentModeInfo = MODES.find((m) => m.id === selectedMode) || MODES[0];

  return (
    <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-3.5">
      {/* Header bar with Mode Selector and Aprimorar Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span>Prompt de Criação</span>
          </label>

          {/* Mode Dropdown / Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 text-xs font-semibold text-zinc-300 transition"
              title="Mudar tom do aprimoramento"
            >
              <span>{currentModeInfo.icon}</span>
              <span className="hidden sm:inline">{currentModeInfo.label}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showModeDropdown && (
              <div
                className="absolute left-0 mt-1.5 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowModeDropdown(false)}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Modo de Aprimoramento
                </div>
                {availableModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSelectedMode(mode.id);
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition ${
                      selectedMode === mode.id
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span className="text-base mt-0.5">{mode.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">{mode.label}</div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{mode.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Aprimorar Prompt */}
        <div className="flex items-center gap-2">
          {history && (
            <button
              type="button"
              onClick={handleUndo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
              title="Desfazer e voltar ao prompt anterior"
            >
              <Undo2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Desfazer</span>
            </button>
          )}

          {history && (
            <button
              type="button"
              onClick={() => setShowCompare(!showCompare)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                showCompare
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
              title="Comparar antes e depois"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comparar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!prompt.trim()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition disabled:opacity-40"
            title="Copiar prompt"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {/* MAIN PROMPT ENHANCE BUTTON */}
          <button
            type="button"
            onClick={handleEnhance}
            disabled={isEnhancing || !prompt.trim()}
            className={`group relative overflow-hidden px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              isEnhancing
                ? 'bg-yellow-600/50 text-yellow-200 border border-yellow-500/50'
                : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-zinc-950 hover:shadow-yellow-500/25 border border-yellow-300'
            }`}
            title="Expandir texto com Gemini AI para uma descrição rica e cinematográfica"
          >
            <Wand2 className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            <span>{isEnhancing ? 'Aprimorando com IA...' : 'Aprimorar Prompt ✨'}</span>
          </button>
        </div>
      </div>

      {/* Main Prompt Textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full bg-zinc-950/90 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 border transition-all resize-none ${
            isEnhancing
              ? 'border-yellow-400 ring-2 ring-yellow-400/20 bg-yellow-950/10'
              : 'border-zinc-800 focus:outline-none focus:border-yellow-400/80 focus:ring-1 focus:ring-yellow-400/30'
          }`}
        />

        {/* Character & Word counter */}
        <div className="absolute right-3 bottom-3 flex items-center gap-3 text-[11px] text-zinc-500 font-mono pointer-events-none">
          <span>{prompt.trim().split(/\s+/).filter(Boolean).length} palavras</span>
          <span>•</span>
          <span>{prompt.length} caracteres</span>
        </div>
      </div>

      {/* Status banner after enhancement */}
      {lastResult && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent rounded-xl border border-yellow-500/30 text-xs text-yellow-200">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
            <span className="font-semibold">
              ✨ Prompt aprimorado com sucesso! (+{lastResult.wordsAdded} palavras de detalhes visuais e iluminação)
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <span>Modo: <strong className="text-yellow-300 font-medium">{currentModeInfo.label}</strong></span>
            <span>•</span>
            <button
              type="button"
              onClick={handleUndo}
              className="text-yellow-300 hover:underline font-bold"
            >
              Reverter ao original
            </button>
          </div>
        </div>
      )}

      {/* Side-by-side comparison modal/view when user clicks 'Comparar' */}
      {showCompare && history && (
        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Columns className="w-3.5 h-3.5 text-yellow-400" />
              Comparação Antes & Depois
            </span>
            <button
              type="button"
              onClick={() => setShowCompare(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-1">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Texto Original</div>
              <p className="text-zinc-300 leading-relaxed italic">{history.original}</p>
            </div>
            <div className="bg-yellow-950/20 p-3 rounded-lg border border-yellow-500/30 space-y-1">
              <div className="text-[10px] font-bold uppercase text-yellow-400">Expandido com Gemini AI</div>
              <p className="text-yellow-100 leading-relaxed">{history.enhanced}</p>
            </div>
          </div>
        </div>
      )}

      {/* Inspiration Prompt Chips */}
      {inspirationChips.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              Ideias rápidas para inspirar:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inspirationChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChangePrompt(chip)}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/40 text-xs text-zinc-300 hover:text-yellow-300 transition text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
