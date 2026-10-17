import React, { useState, useEffect, useRef } from 'react';
import { AspectRatio, Creation, VideoResolution } from '../types';
import { enhancePrompt, generateVideo, downloadMedia } from '../services/api';
import { saveCreation } from '../services/db';
import { creditsManager } from '../services/credits';
import {
  Video,
  Film,
  Sparkles,
  Wand2,
  Download,
  Share2,
  Play,
  Pause,
  Upload,
  AlertCircle,
  Camera,
  Layers,
  Ratio,
  Maximize2,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PromptEnhancer } from './PromptEnhancer';

interface VideoStudioProps {
  initialImage?: string | null;
  initialPrompt?: string;
  onOpenShareModal: (creation: Creation) => void;
  onOpenRoleta: () => void;
  onOpenPlans: () => void;
  onCreationSaved: (creation: Creation) => void;
}

const CAMERA_MOTIONS = [
  { id: 'drone-pan', name: '🛸 Drone Pan', desc: 'Voo aéreo suave e cinemático' },
  { id: 'dynamic-zoom', name: '🔍 Zoom Dinâmico', desc: 'Aproximação com profundidade de campo' },
  { id: 'orbit-360', name: '🔄 Órbita 360°', desc: 'Giro suave ao redor do sujeito central' },
  { id: 'slow-mo', name: '⏱ Slow Motion', desc: 'Câmera lenta hiper-fluida a 60fps' },
  { id: 'handheld', name: '🎥 Câmera Imersiva', desc: 'Movimento realista documental' },
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  initialImage,
  initialPrompt = '',
  onOpenShareModal,
  onOpenRoleta,
  onOpenPlans,
  onCreationSaved,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage || null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<VideoResolution>('720p HD');
  const [cameraMotion, setCameraMotion] = useState('drone-pan');

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [currentVideo, setCurrentVideo] = useState<Creation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (initialImage) {
      setSourceImage(initialImage);
    }
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialImage, initialPrompt]);

  const handleMagicEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const motionName = CAMERA_MOTIONS.find((c) => c.id === cameraMotion)?.name || cameraMotion;
      const enhanced = await enhancePrompt(
        `${prompt}. Movimento de câmera: ${motionName}`,
        'cinematográfico Veo 3.1',
        'video'
      );
      setPrompt(enhanced);
      creditsManager.advanceMission('enhance_prompt', 1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !sourceImage) {
      setErrorMsg('Forneça uma descrição ou selecione uma imagem para criar o vídeo.');
      return;
    }

    const cost = 30; // 30 Banana Credits for Veo video
    if (!creditsManager.hasSufficientCredits(cost)) {
      setErrorMsg(`Créditos insuficientes (${cost} necessários para Veo 3.1 Lite)! Gire a roleta ou faça check-in.`);
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setGenerationStep('Inicializando Google Veo 3.1 Lite...');

    try {
      // Deduct credits
      creditsManager.spendCredits(cost, `Geração Veo 3.1 Lite (${resolution})`);

      const motionName = CAMERA_MOTIONS.find((c) => c.id === cameraMotion)?.name || cameraMotion;
      const fullPrompt = `${prompt || 'Animação cinemática fluida'}. Câmera: ${motionName}. Ultra cinematográfico 4k HDR.`;

      const { videoUrl } = await generateVideo({
        prompt: fullPrompt,
        aspectRatio,
        resolution,
        sourceImage: sourceImage || undefined,
        onProgress: (step) => setGenerationStep(step),
      });

      const newCreation: Creation = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'video',
        title: prompt.slice(0, 40) || 'Vídeo Google Veo 3.1',
        prompt: fullPrompt,
        mediaUrl: videoUrl,
        thumbnailUrl: sourceImage || undefined,
        aspectRatio,
        resolution,
        model: 'Google Veo 3.1 Lite',
        style: motionName,
        views: 1,
        likes: 0,
        downloads: 0,
        isFavorite: false,
        createdAt: Date.now(),
        duration: 4,
      };

      await saveCreation(newCreation);
      setCurrentVideo(newCreation);
      onCreationSaved(newCreation);

      // Advance missions
      creditsManager.advanceMission('gen_veo_video', 1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao gerar vídeo com Veo 3.1 Lite.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Veo Banner */}
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-transparent border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
              Google Veo 3.1 Lite
            </span>
            <span className="text-xs text-purple-300">• Gerador de Vídeos Cinematográficos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Estúdio de Vídeo IA Google Veo
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Crie vídeos a partir de texto ou anime imagens do Nano Banana 2.1 com física hiper-realista, iluminação volumétrica e movimentos de câmera de cinema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRoleta}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition flex items-center gap-1.5"
          >
            🎰 Ganhar Créditos
          </button>
          <button
            onClick={onOpenPlans}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20"
          >
            👑 Veo Ultra VIP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Video Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode: Image-to-Video or Text-to-Video */}
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>Origem do Vídeo</span>
              </label>
              {sourceImage && (
                <button
                  onClick={() => setSourceImage(null)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Remover Imagem
                </button>
              )}
            </div>

            {sourceImage ? (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-950 border border-purple-500/30">
                <img
                  src={sourceImage}
                  alt="Imagem inicial"
                  className="w-16 h-16 rounded-lg object-cover border border-zinc-800"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-purple-300">Modo Imagem-para-Vídeo Ativo</div>
                  <div className="text-[11px] text-zinc-400">
                    O Veo 3.1 Lite dará vida e movimento contínuo a esta imagem.
                  </div>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-zinc-800 hover:border-purple-500/50 bg-zinc-950/60 transition group">
                <Upload className="w-6 h-6 text-zinc-500 group-hover:text-purple-400 mb-2 transition" />
                <span className="text-xs font-bold text-zinc-300 group-hover:text-white">
                  Carregar Imagem para Animar (Opcional)
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  Ou digite apenas o prompt abaixo para Texto-para-Vídeo puro
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Prompt Section with AI Enhancer */}
          <PromptEnhancer
            prompt={prompt}
            onChangePrompt={setPrompt}
            styleContext="cinematográfico Veo 3.1"
            type="video"
            placeholder="Ex: Menina sorrindo e falando em close-up, câmera lenta, iluminação cinematográfica e som sincronizado..."
            rows={3}
            inspirationChips={[
              'Menina comendo sorvete e falando com voz alegre',
              'Travelling cinematográfico sobre praia tropical ao pôr do sol',
              'Supercarro esportivo acelerando na avenida neon na chuva',
              'Retrato cinematográfico com luz volumétrica e vento nos cabelos',
              'Astronauta caminhando em solo extraterrestre com partículas flutuantes',
            ]}
          />

          {/* Camera Motion Selection */}
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Movimento de Câmera Veo</span>
              </label>
              <span className="text-xs text-zinc-500">Controles 3D</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAMERA_MOTIONS.map((motion) => (
                <button
                  key={motion.id}
                  type="button"
                  onClick={() => setCameraMotion(motion.id)}
                  className={`p-3 rounded-xl text-left border transition ${
                    cameraMotion === motion.id
                      ? 'bg-purple-600/20 border-purple-400 text-white shadow-sm'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold text-zinc-100 truncate">{motion.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{motion.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Resolution for Veo */}
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Ratio className="w-3.5 h-3.5 text-purple-400" />
                <span>Formato de Vídeo</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    aspectRatio === '16:9'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>▭ 16:9 Paisagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    aspectRatio === '9:16'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>▯ 9:16 Reels/TikTok</span>
                </button>
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Resolução Veo 3.1</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(['720p HD', '1080p Full HD'] as VideoResolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                      resolution === res
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error message */}
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
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando Vídeo Veo 3.1...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🎬</span>
                <span>Renderizar com Google Veo 3.1 Lite</span>
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  30 Créditos
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Player & Video Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-xl min-h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span>Player Google Veo 3.1</span>
              </span>

              {currentVideo && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {currentVideo.resolution}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                    {currentVideo.aspectRatio}
                  </span>
                </div>
              )}
            </div>

            {/* Video Viewport */}
            <div
              className={`relative w-full rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-center overflow-hidden ${
                aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[500px]' : 'aspect-video'
              }`}
            >
              {isGenerating ? (
                <div className="text-center p-6 space-y-4 max-w-xs">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl animate-pulse">
                    🎬
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-purple-300 animate-pulse">
                      {generationStep || 'Processando quadros...'}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Calculando simulação de dinâmica de fluídos e óptica
                    </div>
                  </div>
                  {/* Visual progress bar */}
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 animate-[pulse_1.5s_infinite] w-full" />
                  </div>
                </div>
              ) : currentVideo ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                  <video
                    ref={videoRef}
                    src={currentVideo.mediaUrl}
                    loop
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Play / Pause big overlay */}
                  <button
                    onClick={togglePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-14 h-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg transform transition hover:scale-110">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </div>
                  </button>

                  {/* Sound Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-zinc-900/80 text-white hover:bg-zinc-800 transition"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="text-center p-8 text-zinc-600 space-y-2">
                  <div className="text-4xl opacity-30">🎬</div>
                  <p className="text-sm font-medium">Seu vídeo cinematográfico aparecerá aqui</p>
                  <p className="text-xs text-zinc-500">
                    Texto-para-Vídeo ou Imagem-para-Vídeo com Google Veo 3.1 Lite
                  </p>
                </div>
              )}
            </div>

            {/* Video Controls & Download */}
            {currentVideo && (
              <div className="mt-4 space-y-2 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-300 line-clamp-2 italic">
                  "{currentVideo.prompt}"
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Download MP4 */}
                  <button
                    onClick={() => {
                      downloadMedia(currentVideo.mediaUrl, `google-veo-${Date.now()}.mp4`);
                      creditsManager.advanceMission('share_social', 1);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Baixar Vídeo MP4</span>
                  </button>

                  {/* Social Share */}
                  <button
                    onClick={() => onOpenShareModal(currentVideo)}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition"
                  >
                    <Share2 className="w-4 h-4 text-purple-200" />
                    <span>Compartilhar Vídeo</span>
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
