import React, { useState } from 'react';
import { Creation } from '../types';
import { creditsManager } from '../services/credits';
import { downloadMedia } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Share2,
  X,
  MessageCircle,
  Twitter,
  Send,
  Instagram,
  Copy,
  Check,
  Download,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  creation: Creation | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ creation, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!creation) return null;

  const appUrl = window.location.href;
  const shareText = `🍌 Olha essa criação incrível que gerei com o Google Nano Banana 2.1 & Veo 3.1 Studio!\n\n"${creation.prompt}"\n\n#GoogleAI #NanoBanana #Veo3`;

  const recordShare = () => {
    creditsManager.advanceMission('share_social', 1);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // WhatsApp
  const handleShareWhatsApp = () => {
    recordShare();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + appUrl)}`;
    window.open(url, '_blank');
  };

  // Twitter / X
  const handleShareTwitter = () => {
    recordShare();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(url, '_blank');
  };

  // Telegram
  const handleShareTelegram = () => {
    recordShare();
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  // Native Web Share
  const handleNativeShare = async () => {
    recordShare();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Google Nano Banana 2.1 & Veo 3.1 Studio',
          text: shareText,
          url: appUrl,
        });
      } catch (err) {
        console.warn('Share cancelado', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${shareText}\n${appUrl}`);
    setCopied(true);
    recordShare();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = creation.type === 'video' ? 'mp4' : 'png';
    downloadMedia(creation.mediaUrl, `banana-${creation.id}.${ext}`);
    recordShare();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-yellow-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-black uppercase mb-1">
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhamento Social</span>
          </div>
          <h2 className="text-xl font-black text-white">Compartilhe sua Criação</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Envie diretamente para amigos e redes sociais e ganhe créditos bônus!
          </p>
        </div>

        {/* Thumbnail Preview */}
        <div className="w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden mb-4 relative flex items-center justify-center">
          {creation.type === 'video' ? (
            <video src={creation.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={creation.mediaUrl} alt={creation.prompt} className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-zinc-300 font-bold truncate max-w-[260px]">
            "{creation.prompt}"
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5 transition"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span>WhatsApp</span>
          </button>

          {/* Twitter / X */}
          <button
            onClick={handleShareTwitter}
            className="p-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-bold flex items-center gap-2.5 transition"
          >
            <div className="p-1.5 rounded-lg bg-sky-400 text-zinc-950">
              <Twitter className="w-4 h-4" />
            </div>
            <span>Twitter / X</span>
          </button>

          {/* Telegram */}
          <button
            onClick={handleShareTelegram}
            className="p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 text-xs font-bold flex items-center gap-2.5 transition"
          >
            <div className="p-1.5 rounded-lg bg-blue-500 text-white">
              <Send className="w-4 h-4" />
            </div>
            <span>Telegram</span>
          </button>

          {/* Instagram Stories Format */}
          <button
            onClick={handleDownload}
            className="p-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-300 text-xs font-bold flex items-center gap-2.5 transition"
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 to-pink-500 text-white">
              <Instagram className="w-4 h-4" />
            </div>
            <span>Instagram Story</span>
          </button>
        </div>

        {/* Copy Link & Download options */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <button
            onClick={handleCopyText}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Texto e Link Copiados!' : 'Copiar Texto & Link para Compartilhar'}</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-bold flex items-center justify-center gap-2 shadow transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Abrir Menu de Compartilhamento do Dispositivo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
