import React, { useState } from 'react';
import { Creation } from '../types';
import { downloadMedia } from '../services/api';
import { toggleFavorite, deleteCreation, incrementCreationMetric } from '../services/db';
import {
  X,
  Download,
  Share2,
  Video,
  Heart,
  Trash2,
  Copy,
  Check,
  Eye,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CreationDetailModalProps {
  creation: Creation | null;
  onClose: () => void;
  onOpenShareModal: (creation: Creation) => void;
  onSendToVideoStudio: (image: string, prompt: string) => void;
  onRefresh: () => void;
}

export const CreationDetailModal: React.FC<CreationDetailModalProps> = ({
  creation,
  onClose,
  onOpenShareModal,
  onSendToVideoStudio,
  onRefresh,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isFav, setIsFav] = useState(creation?.isFavorite || false);

  if (!creation) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(creation.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleFavorite = async () => {
    const nextState = await toggleFavorite(creation.id);
    setIsFav(nextState);
    onRefresh();
  };

  const handleDelete = async () => {
    if (confirm('Deseja excluir esta criação permanentemente da sua galeria local?')) {
      await deleteCreation(creation.id);
      onRefresh();
      onClose();
    }
  };

  const handleDownload = () => {
    const ext = creation.type === 'video' ? 'mp4' : 'png';
    downloadMedia(creation.mediaUrl, `${creation.type}-${creation.id}.${ext}`);
    incrementCreationMetric(creation.id, 'downloads');
    onRefresh();
  };

  const formattedDate = new Date(creation.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Preview Box (Left / Top) */}
        <div className="w-full md:w-3/5 bg-zinc-950 rounded-2xl border border-zinc-800/80 overflow-hidden flex items-center justify-center relative min-h-[300px] max-h-[500px]">
          {creation.type === 'video' ? (
            <video
              src={creation.mediaUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={creation.mediaUrl}
              alt={creation.prompt}
              className="w-full h-full object-contain"
            />
          )}

          {/* Model Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-sm text-[11px] font-black text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5 shadow">
            <span>{creation.type === 'video' ? '🎬 Google Veo 3.1' : '🍌 Nano Banana 2.1'}</span>
          </div>
        </div>

        {/* Metadata & Actions (Right / Bottom) */}
        <div className="w-full md:w-2/5 flex flex-col justify-between space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-300">
                {creation.resolution}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-300">
                {creation.aspectRatio}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400">
                {creation.style}
              </span>
            </div>

            {/* Prompt */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Prompt
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPrompt ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans">{creation.prompt}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Visitas</div>
                <div className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                  <Eye className="w-3 h-3 text-zinc-400" />
                  <span>{creation.views || 1}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Downloads</div>
                <div className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                  <Download className="w-3 h-3 text-zinc-400" />
                  <span>{creation.downloads || 0}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Favorito</div>
                <button
                  onClick={handleFavorite}
                  className="mt-0.5 inline-flex items-center justify-center"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-zinc-500'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-3">
              <Calendar className="w-3 h-3" />
              <span>Criado em {formattedDate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            {/* If Image, option to animate with Veo 3.1 Lite */}
            {creation.type === 'image' && (
              <button
                onClick={() => {
                  onClose();
                  onSendToVideoStudio(creation.mediaUrl, creation.prompt);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition"
              >
                <Video className="w-4 h-4" />
                <span>Animar com Google Veo 3.1 Lite</span>
              </button>
            )}

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full py-2.5 px-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-bold flex items-center justify-center gap-2 shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo em Alta Resolução</span>
            </button>

            {/* Share and Delete row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenShareModal(creation)}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Compartilhar</span>
              </button>

              <button
                onClick={handleDelete}
                className="py-2 px-3 rounded-xl bg-zinc-800/60 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-800 hover:border-red-500/30 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
