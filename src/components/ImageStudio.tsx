import React, { useState } from 'react';
import { AspectRatio, Creation, ImageModel, ImageResolution } from '../types';
import { enhancePrompt, generateImage, downloadMedia } from '../services/api';
import { saveCreation } from '../services/db';
import { creditsManager } from '../services/credits';
import {
  Sparkles,
  Wand2,
  Download,
  Share2,
  Video,
  Heart,
  Shuffle,
  Layers,
  Ratio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';
import { PromptEnhancer } from './PromptEnhancer';

interface ImageStudioProps {
  onSendToVideoStudio: (image: string, prompt: string) => void;
  onOpenShareModal: (creation: Creation) => void;
  onOpenRoleta: () => void;
  onOpenPlans: () => void;
  onCreationSaved: (creation: Creation) => void;
}

const STYLE_PRESETS = [
  { id: 'fotorealista', name: '📸 Fotorealista 8K', desc: 'Lente 85mm, iluminação de estúdio realista', icon: '📸', modifier: 'photorealistic 8k, ultra-realistic photograph, 85mm lens, natural studio lighting, true-to-life details' },
  { id: 'cinema-35mm', name: '🎬 Cinema 35mm', desc: 'Granulação clássica, anamórfica de Hollywood', icon: '🎬', modifier: 'cinematic 35mm film still, Kodak Portra 400, dramatic volumetric lighting, movie color grading' },
  { id: 'anime-ghibli', name: '✨ Anime Ghibli', desc: 'Aquarela cósmica e atmosfera mágica', icon: '✨', modifier: 'Studio Ghibli anime style, vibrant watercolor aesthetics, Makoto Shinkai sky, hand-drawn anime artwork' },
  { id: 'cyberpunk', name: '🤖 Cyberpunk Neon', desc: 'Cidades holográficas e luzes futuristas', icon: '🤖', modifier: 'cyberpunk aesthetic, futuristic neon glow, volumetric holographic lighting, sleek reflective surfaces' },
  { id: 'pixar-3d', name: '🧸 3D Pixar / Disney', desc: 'Texturas aveludadas e iluminação suave 3D', icon: '🧸', modifier: '3D Pixar Disney animated movie style, smooth render, subsurface scattering, expressive charming characters' },
  { id: 'oleo-renascenca', name: '🎨 Óleo Clássico', desc: 'Pinceladas ricas e chiaroscuro renascentista', icon: '🎨', modifier: 'classical oil painting, textured brushstrokes, chiaroscuro lighting, masterpiece canvas art' },
  { id: 'fantasia-epica', name: '🌌 Fantasia Épica', desc: 'Criaturas míticas e magia celestial', icon: '🌌', modifier: 'epic fantasy art, mythical celestial atmosphere, magical lighting, otherworldly masterpiece' },
  { id: 'banana-pop', name: '🍌 Banana Pop', desc: 'Cores vibrantes, estética Google 3D alegre', icon: '🍌', modifier: 'vibrant pop art 3D, glossy joyful accents, hyper-saturated colorful aesthetics' },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string; desc: string }[] = [
  { value: '1:1', label: '1:1', icon: '▢', desc: 'Quadrado (Instagram, Avatar)' },
  { value: '16:9', label: '16:9', icon: '▭', desc: 'Cinema / YouTube / Paisagem' },
  { value: '9:16', label: '9:16', icon: '▯', desc: 'Reels / Stories / TikTok' },
  { value: '4:3', label: '4:3', icon: '▱', desc: 'Padrão Fotográfico' },
  { value: '3:4', label: '3:4', icon: '▯', desc: 'Retrato Clássico' },
  { value: '21:9', label: '21:9', icon: '━', desc: 'Ultra-wide Cinemático' },
];

const INSPIRATION_PROMPTS = [
  'Uma pessoa feliz com sua família reunida no McDonald\'s comendo hambúrgueres e batatas fritas, sorrindo juntos',
  'Um macaquinho astronauta saboreando uma fruta holográfica neon flutuando na órbita de Júpiter',
  'Cidade futurista coberta por bioluminescência dourada, trens magnéticos voadores e chuva fina',
  'Retrato fotográfico de uma mulher cibernética com pele de porcelana e olhos cor de âmbar dourado',
  'Gatinho guerreiro samurai com armadura detalhada e katana reluzente sob pétalas de cerejeira',
  'Ilha flutuante mágica no pôr do sol com cachoeiras cósmicas que caem nas nuvens estreladas',
  'Supercarro esportivo conceitual dourado correndo em uma estrada de vidro no meio do deserto ao entardecer',
];

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onSendToVideoStudio,
  onOpenShareModal,
  onOpenRoleta,
  onOpenPlans,
  onCreationSaved,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('fotorealista');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [resolution, setResolution] = useState<ImageResolution>('Full HD');
  const [model, setModel] = useState<ImageModel>('gemini-nano-banana-2.1');

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [currentCreation, setCurrentCreation] = useState<Creation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleMagicEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const activeStyle = STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name || selectedStyle;
      const enhanced = await enhancePrompt(prompt, activeStyle, 'image');
      setPrompt(enhanced);
      creditsManager.advanceMission('enhance_prompt', 1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleInspiration = () => {
    const random = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
    setPrompt(random);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Por favor, escreva uma descrição ou ideia para gerar a imagem.');
      return;
    }

    const cost = resolution === '4K Ultra' ? 15 : 10;
    if (!creditsManager.hasSufficientCredits(cost)) {
      setErrorMsg(`Créditos insuficientes (${cost} necessários)! Gire a roleta ou faça check-in.`);
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      // Deduct credits
      creditsManager.spendCredits(cost, `Geração Nano Banana 2.1 (${resolution})`);

      const activePreset = STYLE_PRESETS.find((s) => s.id === selectedStyle);
      const activeStyle = activePreset ? `${activePreset.name}: ${activePreset.modifier}` : selectedStyle;
      const { imageUrl } = await generateImage({
        prompt,
        model,
        aspectRatio,
        resolution,
        style: activeStyle,
      });

      const newCreation: Creation = {
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'image',
        title: prompt.slice(0, 40),
        prompt,
        mediaUrl: imageUrl,
        thumbnailUrl: imageUrl,
        aspectRatio,
        resolution,
        model: 'Google Nano Banana 2.1',
        style: activePreset?.name || selectedStyle,
        views: 1,
        likes: 0,
        downloads: 0,
        isFavorite: false,
        createdAt: Date.now(),
      };

      await saveCreation(newCreation);
      setCurrentCreation(newCreation);
      onCreationSaved(newCreation);

      // Advance missions
      creditsManager.advanceMission('gen_first_image', 1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!currentCreation) return;
    navigator.clipboard.writeText(currentCreation.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Studio Banner */}
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-400 text-zinc-950">
              Google Nano Banana 2.1
            </span>
            <span className="text-xs text-zinc-400">• Ultra High Definition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gerador de Imagens HD, Full HD & 4K
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Crie artes impressionantes em qualquer formato, aprimore com inteligência artificial mágica, baixe em alta resolução e transforme em vídeo com Google Veo 3.1.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRoleta}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-yellow-500/30 text-xs font-bold flex items-center gap-1.5 transition"
          >
            🎰 Roleta de Créditos
          </button>
          <button
            onClick={onOpenPlans}
            className="px-3.5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-yellow-500/20"
          >
            👑 Planos Ilimitados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Section with AI Enhancer */}
          <PromptEnhancer
            prompt={prompt}
            onChangePrompt={setPrompt}
            styleContext={selectedStyle}
            type="image"
            placeholder="Ex: Uma linda menina sorrindo e comendo sorvete de morango no parque ensolarado..."
            rows={4}
            inspirationChips={[
              'Menina feliz no parque tomando sorvete',
              'Supercarro esportivo dourado no pôr do sol',
              'Gatinho samurai com armadura detalhada',
              'Castelo flutuante com cachoeiras cósmicas',
              'Cidade futurista neon com carros voadores',
            ]}
          />

          {/* Style Presets */}
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Estilo Visual</span>
              </label>
              <span className="text-xs text-zinc-500">8 Estilos Google AI</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedStyle === style.id
                      ? 'bg-gradient-to-b from-yellow-500/20 to-amber-500/10 border-yellow-400 text-white shadow-md'
                      : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xl mb-1">{style.icon}</div>
                  <div className="text-xs font-bold truncate text-zinc-100">{style.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Formats & Aspect Ratios */}
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Ratio className="w-3.5 h-3.5 text-blue-400" />
                <span>Proporção & Formato</span>
              </label>
              <span className="text-xs text-zinc-500">HD / Widescreen / Stories</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ASPECT_RATIOS.map((aspect) => (
                <button
                  key={aspect.value}
                  type="button"
                  onClick={() => setAspectRatio(aspect.value)}
                  className={`py-3 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                    aspectRatio === aspect.value
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-sm'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                  title={aspect.desc}
                >
                  <span className="text-lg leading-none mb-1 font-mono">{aspect.icon}</span>
                  <span className="text-xs font-black">{aspect.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution & Model Settings */}
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Qualidade de Saída</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(['HD', 'Full HD', '4K Ultra'] as ImageResolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                      resolution === res
                        ? 'bg-zinc-800 text-yellow-400 border border-yellow-500/30 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Motor de IA</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModel('gemini-nano-banana-2.1')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition truncate ${
                    model === 'gemini-nano-banana-2.1'
                      ? 'bg-zinc-800 text-yellow-400 border border-yellow-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Nano Banana 2.1
                </button>
                <button
                  type="button"
                  onClick={() => setModel('gemini-3.1-flash-lite-image')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition truncate ${
                    model === 'gemini-3.1-flash-lite-image'
                      ? 'bg-zinc-800 text-yellow-400 border border-yellow-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Flash Lite
                </button>
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1">{errorMsg}</div>
              <button
                onClick={onOpenRoleta}
                className="px-2.5 py-1 rounded bg-yellow-400 text-zinc-950 font-bold text-xs"
              >
                Girar Roleta
              </button>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-zinc-950 font-black text-base shadow-xl shadow-yellow-500/25 flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Google Nano Banana 2.1 Renderizando...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🍌</span>
                <span>Gerar Imagem de Alta Qualidade</span>
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-950/20 text-zinc-950 font-bold">
                  {resolution === '4K Ultra' ? '15' : '10'} Créditos
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Output & Preview Area (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl min-h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Visualização & Exportação</span>
              </span>

              {currentCreation && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    {currentCreation.resolution}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                    {currentCreation.aspectRatio}
                  </span>
                </div>
              )}
            </div>

            {/* Media Canvas / Preview */}
            <div
              className={`relative w-full rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-center overflow-hidden group transition-all ${
                currentCreation?.aspectRatio === '16:9'
                  ? 'aspect-video'
                  : currentCreation?.aspectRatio === '9:16'
                  ? 'aspect-[9/16] max-h-[480px]'
                  : currentCreation?.aspectRatio === '4:3'
                  ? 'aspect-[4/3]'
                  : currentCreation?.aspectRatio === '3:4'
                  ? 'aspect-[3/4] max-h-[480px]'
                  : currentCreation?.aspectRatio === '21:9'
                  ? 'aspect-[21/9]'
                  : 'aspect-square'
              }`}
            >
              {isGenerating ? (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-3xl animate-bounce">
                    🍌
                  </div>
                  <div className="text-sm font-bold text-yellow-300 animate-pulse">
                    Sintetizando detalhes e texturas...
                  </div>
                  <div className="text-xs text-zinc-500">Google Nano Banana 2.1 AI</div>
                </div>
              ) : currentCreation ? (
                <>
                  <img
                    src={currentCreation.mediaUrl}
                    alt={currentCreation.prompt}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Overlay Quick Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                    <button
                      onClick={handleCopyPrompt}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 text-zinc-200 text-xs font-medium flex items-center gap-1 hover:bg-zinc-800"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPrompt ? 'Copiado!' : 'Copiar Prompt'}</span>
                    </button>

                    <button
                      onClick={() => onOpenShareModal(currentCreation)}
                      className="px-2.5 py-1.5 rounded-lg bg-yellow-500 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-md hover:bg-yellow-400"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-zinc-600 space-y-2">
                  <div className="text-4xl opacity-30">🍌</div>
                  <p className="text-sm font-medium">Sua obra-prima aparecerá aqui</p>
                  <p className="text-xs text-zinc-500">Escolha o estilo e clique em gerar acima</p>
                </div>
              )}
            </div>

            {/* Action Bar when creation ready */}
            {currentCreation && (
              <div className="mt-4 space-y-2 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-300 line-clamp-2 italic">
                  "{currentCreation.prompt}"
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Download HD Button */}
                  <button
                    onClick={() => {
                      downloadMedia(currentCreation.mediaUrl, `nano-banana-${Date.now()}.png`);
                      creditsManager.advanceMission('share_social', 1);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download {currentCreation.resolution}</span>
                  </button>

                  {/* Animate with Veo 3.1 Lite Button */}
                  <button
                    onClick={() => onSendToVideoStudio(currentCreation.mediaUrl, currentCreation.prompt)}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition"
                  >
                    <Video className="w-4 h-4 text-purple-200" />
                    <span>Animar com Veo 3.1</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
