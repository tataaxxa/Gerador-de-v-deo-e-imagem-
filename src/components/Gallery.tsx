import React, { useState } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { Creation } from '../types';
import {
  LayoutGrid,
  Search,
  Filter,
  Eye,
  Heart,
  Download,
  Share2,
  Trash2,
  Film,
  Image as ImageIcon,
  Flame,
  CheckSquare,
  Square,
  FileArchive,
  X,
  Check,
  Loader2,
  Layers,
} from 'lucide-react';
import { toggleFavorite, deleteCreation, incrementCreationMetric } from '../services/db';
import { downloadMedia } from '../services/api';
import { creditsManager } from '../services/credits';

interface GalleryProps {
  creations: Creation[];
  onSelectCreation: (creation: Creation) => void;
  onOpenShareModal: (creation: Creation) => void;
  onSendToVideoStudio: (image: string, prompt: string) => void;
  onRefreshCreations: () => void;
  onCreateNew: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  creations,
  onSelectCreation,
  onOpenShareModal,
  onSendToVideoStudio,
  onRefreshCreations,
  onCreateNew,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'favorite' | 'popular'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'likes'>('recent');

  // Multi-selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<string>('');

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleFavorite(id);
    onRefreshCreations();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja realmente remover esta criação da sua galeria local?')) {
      await deleteCreation(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onRefreshCreations();
    }
  };

  const handleDownload = (e: React.MouseEvent, item: Creation) => {
    e.stopPropagation();
    const ext = item.type === 'video' ? 'mp4' : 'png';
    downloadMedia(item.mediaUrl, `${item.type}-${item.id}.${ext}`);
    incrementCreationMetric(item.id, 'downloads');
    onRefreshCreations();
  };

  const handleClickItem = (item: Creation) => {
    if (isSelectionMode) {
      toggleSelectItem(item.id);
      return;
    }
    // Increment view metric ("gerei mais visitadas")
    incrementCreationMetric(item.id, 'views');
    creditsManager.advanceMission('collect_views', 1);
    onSelectCreation(item);
  };

  // Toggle selection for a single item
  const toggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter & Search
  const filteredCreations = creations
    .filter((c) => {
      if (filterType === 'image') return c.type === 'image';
      if (filterType === 'video') return c.type === 'video';
      if (filterType === 'favorite') return c.isFavorite;
      if (filterType === 'popular') return (c.views || 0) >= 2;
      return true;
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.prompt.toLowerCase().includes(q) ||
        c.style.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'views' || filterType === 'popular') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      return b.createdAt - a.createdAt;
    });

  // Select all visible items
  const handleSelectAll = () => {
    if (selectedIds.size === filteredCreations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCreations.map((c) => c.id)));
    }
  };

  // Bulk delete selected items
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Deseja realmente remover os ${selectedIds.size} itens selecionados da sua galeria?`)) {
      for (const id of Array.from(selectedIds)) {
        await deleteCreation(id);
      }
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      onRefreshCreations();
    }
  };

  // Download selected as ZIP
  const handleDownloadZip = async () => {
    const selectedItems = creations.filter((c) => selectedIds.has(c.id));
    if (selectedItems.length === 0) return;

    setIsZipping(true);
    setZipProgress(`Preparando ${selectedItems.length} arquivos...`);

    try {
      const zip = new JSZip();
      const metaEntries: any[] = [];

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        setZipProgress(`Baixando e compactando ${i + 1} de ${selectedItems.length}...`);

        try {
          const res = await fetch(item.mediaUrl);
          const blob = await res.blob();
          const ext = item.type === 'video' ? 'mp4' : 'png';
          const cleanPrompt = item.prompt
            .slice(0, 35)
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_');
          const filename = `${String(i + 1).padStart(2, '0')}_${item.type}_${cleanPrompt}.${ext}`;

          zip.file(filename, blob);

          metaEntries.push({
            arquivo: filename,
            tipo: item.type,
            modelo: item.model,
            estilo: item.style,
            resolucao: item.resolution,
            proporcao: item.aspectRatio,
            prompt: item.prompt,
            criadoEm: new Date(item.createdAt).toISOString(),
          });

          // Update individual download counter
          incrementCreationMetric(item.id, 'downloads');
        } catch (itemErr) {
          console.warn(`Falha ao empacotar item ${item.id}`, itemErr);
        }
      }

      // Add a detailed manifest/metadata file inside the zip
      zip.file(
        'manifesto_nano_banana.json',
        JSON.stringify(
          {
            gerador: 'Google Nano Banana 2.1 & Veo 3.1 Lite Studio',
            totalArquivos: selectedItems.length,
            exportadoEm: new Date().toISOString(),
            itens: metaEntries,
          },
          null,
          2
        )
      );

      setZipProgress('Gerando arquivo .ZIP final...');
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setZipProgress(`Compactando ${Math.round(metadata.percent)}%...`);
      });

      // Trigger browser download
      const zipUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = zipUrl;
      downloadLink.download = `nano-banana-criações-${Date.now()}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(zipUrl);

      // Advance missions and trigger celebration
      creditsManager.advanceMission('share_social', 1);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      onRefreshCreations();
    } catch (err: any) {
      console.error('Erro ao gerar arquivo ZIP:', err);
      alert('Houve um erro ao compactar os arquivos: ' + err.message);
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              Galeria Local Permanente
            </span>
            <span className="text-xs text-zinc-400">IndexedDB Seguro • Download em Lote .ZIP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Minhas Obras de Arte & Vídeos</span>
            <span className="text-sm font-semibold text-zinc-500">({creations.length})</span>
          </h1>
        </div>

        {/* Right Action buttons & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Multi-Select Mode */}
          <button
            onClick={() => {
              if (isSelectionMode) {
                setSelectedIds(new Set());
                setIsSelectionMode(false);
              } else {
                setIsSelectionMode(true);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              isSelectionMode
                ? 'bg-yellow-500 text-zinc-950 border-yellow-400 shadow-md shadow-yellow-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
          >
            {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <span>{isSelectionMode ? 'Sair da Seleção' : 'Selecionar Múltiplos'}</span>
          </button>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar prompt, estilo..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition"
            />
          </div>
        </div>
      </div>

      {/* Floating Sticky Batch Action Bar when Selection is Active */}
      {isSelectionMode && (
        <div className="sticky top-20 z-30 mb-6 p-4 rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-yellow-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {selectedIds.size === filteredCreations.length && filteredCreations.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Desmarcar Todos</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Selecionar Todos ({filteredCreations.length})</span>
                </>
              )}
            </button>

            <span className="text-xs font-bold text-yellow-300">
              {selectedIds.size}{' '}
              {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Selected as ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={selectedIds.size === 0 || isZipping}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-zinc-950 font-black text-xs shadow-lg shadow-yellow-500/20 flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>{zipProgress || 'Gerando ZIP...'}</span>
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4" />
                  <span>Baixar Selecionados (.ZIP)</span>
                </>
              )}
            </button>

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || isZipping}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 hover:border-red-500/40 transition disabled:opacity-40"
              title="Excluir selecionados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excluir</span>
            </button>

            {/* Close Selection Bar */}
            <button
              onClick={() => {
                setSelectedIds(new Set());
                setIsSelectionMode(false);
              }}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              title="Cancelar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'all' ? 'bg-yellow-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Todas ({creations.length})</span>
          </button>

          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'image' ? 'bg-yellow-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Imagens ({creations.filter((c) => c.type === 'image').length})</span>
          </button>

          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'video' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Vídeos ({creations.filter((c) => c.type === 'video').length})</span>
          </button>

          <button
            onClick={() => setFilterType('popular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'popular' ? 'bg-orange-500 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Mais Visitadas 🔥</span>
          </button>

          <button
            onClick={() => setFilterType('favorite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'favorite' ? 'bg-rose-500 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favoritas ({creations.filter((c) => c.isFavorite).length})</span>
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Ordenar por:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-400"
          >
            <option value="recent">Mais Recentes</option>
            <option value="views">Mais Visualizadas</option>
            <option value="likes">Mais Curtidas</option>
          </select>
        </div>
      </div>

      {/* Grid of Creations */}
      {filteredCreations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredCreations.map((item) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleClickItem(item)}
                className={`group bg-zinc-900 rounded-2xl border overflow-hidden shadow-lg transition-all cursor-pointer flex flex-col relative ${
                  isSelected
                    ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-yellow-500/20'
                    : 'border-zinc-800 hover:border-yellow-500/50 hover:shadow-yellow-500/10'
                }`}
              >
                {/* Multi-Select Checkbox overlay */}
                <div
                  onClick={(e) => toggleSelectItem(item.id, e)}
                  className={`absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-yellow-400 text-zinc-950 shadow-md scale-105'
                      : isSelectionMode
                      ? 'bg-black/60 border border-zinc-600 text-white hover:border-yellow-400'
                      : 'opacity-0 group-hover:opacity-100 bg-black/60 border border-zinc-600 text-white hover:border-yellow-400'
                  }`}
                  title={isSelected ? 'Desmarcar' : 'Selecionar'}
                >
                  {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4 text-zinc-400" />}
                </div>

                {/* Media Thumbnail Container */}
                <div className="relative aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                  {item.type === 'video' ? (
                    <>
                      <video
                        src={item.mediaUrl}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isSelected ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                        muted
                        playsInline
                        loop
                      />
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                        <Film className="w-3 h-3" />
                        <span>Veo 3.1</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={item.mediaUrl}
                        alt={item.prompt}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isSelected ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                      />
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-yellow-500/90 text-zinc-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                        <span>🍌 {item.resolution}</span>
                      </div>
                    </>
                  )}

                  {/* Aspect ratio badge */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-zinc-300 text-[10px] font-bold">
                    {item.aspectRatio}
                  </div>

                  {/* Hover Quick Actions (when not in multi-selection mode) */}
                  {!isSelectionMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
                      <div className="flex items-center gap-2 pointer-events-auto">
                        <button
                          onClick={(e) => handleDownload(e, item)}
                          title="Download individual"
                          className="p-2 rounded-lg bg-zinc-800/90 text-white hover:bg-yellow-500 hover:text-zinc-950 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenShareModal(item);
                          }}
                          title="Compartilhar"
                          className="p-2 rounded-lg bg-zinc-800/90 text-white hover:bg-yellow-500 hover:text-zinc-950 transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        <button
                          onClick={(e) => handleToggleFavorite(e, item.id)}
                          title="Favoritar"
                          className="p-2 rounded-lg bg-zinc-800/90 text-white hover:text-rose-500 transition"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              item.isFavorite ? 'text-rose-500 fill-rose-500' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          title="Excluir"
                          className="p-2 rounded-lg bg-zinc-800/90 text-zinc-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <p className="text-xs text-zinc-200 line-clamp-2 font-medium" title={item.prompt}>
                    "{item.prompt}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                    <span className="truncate max-w-[120px] font-mono">{item.style}</span>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="flex items-center gap-1 text-zinc-400" title="Visualizações">
                        <Eye className="w-3 h-3 text-zinc-500" />
                        <span>{item.views || 0}</span>
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400" title="Downloads">
                        <Download className="w-3 h-3 text-zinc-500" />
                        <span>{item.downloads || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-zinc-900/50 border border-zinc-800/80 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-3xl">
            🍌
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Nenhuma criação encontrada</h3>
            <p className="text-xs text-zinc-400">
              {searchQuery
                ? 'Nenhum resultado corresponde à sua pesquisa. Tente outros termos.'
                : 'Você ainda não possui criações nesta categoria. Que tal gerar sua primeira agora?'}
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs shadow-lg shadow-yellow-500/20 transition"
          >
            Criar Agora com Nano Banana 2.1
          </button>
        </div>
      )}
    </div>
  );
};
