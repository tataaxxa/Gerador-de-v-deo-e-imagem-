import React, { useState, useEffect } from 'react';
import { Creation, Mission, UserEconomy } from './types';
import { creditsManager } from './services/credits';
import { getAllCreations, saveCreation } from './services/db';
import { generateProceduralArtwork, generateProceduralVideo } from './services/proceduralFallback';

import { Navbar } from './components/Navbar';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import { Gallery } from './components/Gallery';
import { RoletaWheel } from './components/RoletaWheel';
import { CalendarGamesModal } from './components/CalendarGamesModal';
import { MissionsModal } from './components/MissionsModal';
import { PlansModal } from './components/PlansModal';
import { ShareModal } from './components/ShareModal';
import { CreationDetailModal } from './components/CreationDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'image' | 'video' | 'gallery'>('image');
  const [economy, setEconomy] = useState<UserEconomy>(creditsManager.getEconomy());
  const [missions, setMissions] = useState<Mission[]>(creditsManager.getMissions());
  const [creations, setCreations] = useState<Creation[]>([]);

  // Modals state
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isRoletaOpen, setIsRoletaOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [shareCreation, setShareCreation] = useState<Creation | null>(null);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);

  // Cross-studio bridge: Image -> Veo Video
  const [veoInitialImage, setVeoInitialImage] = useState<string | null>(null);
  const [veoInitialPrompt, setVeoInitialPrompt] = useState<string>('');

  // Subscribe to economy and missions
  useEffect(() => {
    const unsubEconomy = creditsManager.subscribeEconomy((eco) => setEconomy(eco));
    const unsubMissions = creditsManager.subscribeMissions((mis) => setMissions(mis));
    return () => {
      unsubEconomy();
      unsubMissions();
    };
  }, []);

  // Load creations from IndexedDB
  const refreshCreations = async () => {
    const items = await getAllCreations();
    if (items.length === 0) {
      // Seed with initial high quality Google Nano Banana and Veo creations
      try {
        const seedImg = await generateProceduralArtwork(
          'Astronauta explorador descobrindo um templo dourado com banana cósmica em Júpiter',
          '🍌 Banana Pop',
          '1:1',
          '4K Ultra'
        );
        const sample1: Creation = {
          id: 'seed_img_1',
          type: 'image',
          title: 'Templo Cósmico Dourado',
          prompt: 'Astronauta explorador descobrindo um templo dourado com banana cósmica em Júpiter',
          mediaUrl: seedImg,
          thumbnailUrl: seedImg,
          aspectRatio: '1:1',
          resolution: '4K Ultra',
          model: 'Google Nano Banana 2.1',
          style: '🍌 Banana Pop',
          views: 12,
          likes: 5,
          downloads: 3,
          isFavorite: true,
          createdAt: Date.now() - 3600000 * 2,
        };
        await saveCreation(sample1);

        const seedVid = await generateProceduralVideo(
          'Voo cinemático sobre metrópole neon dourada',
          '16:9',
          '1080p Full HD'
        );
        const sample2: Creation = {
          id: 'seed_vid_1',
          type: 'video',
          title: 'Metrópole Neon Dourada',
          prompt: 'Voo cinemático sobre metrópole neon dourada com física de partículas e iluminação volumétrica',
          mediaUrl: seedVid,
          aspectRatio: '16:9',
          resolution: '1080p Full HD',
          model: 'Google Veo 3.1 Lite',
          style: '🛸 Drone Pan',
          views: 19,
          likes: 8,
          downloads: 6,
          isFavorite: false,
          createdAt: Date.now() - 3600000 * 5,
          duration: 4,
        };
        await saveCreation(sample2);

        setCreations([sample1, sample2]);
        return;
      } catch (e) {
        console.warn('Erro ao semear criações iniciais:', e);
      }
    }
    setCreations(items);
  };

  useEffect(() => {
    refreshCreations();
  }, []);

  const handleSendToVideoStudio = (image: string, prompt: string) => {
    setVeoInitialImage(image);
    setVeoInitialPrompt(prompt);
    setCurrentTab('video');
  };

  const handleCreationSaved = (newCreation: Creation) => {
    setCreations((prev) => [newCreation, ...prev]);
  };

  const claimableMissionsCount = missions.filter((m) => m.isCompleted && !m.isClaimed).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-zinc-950">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        economy={economy}
        onOpenCheckin={() => setIsCheckinOpen(true)}
        onOpenRoleta={() => setIsRoletaOpen(true)}
        onOpenMissions={() => setIsMissionsOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
        onEmergencyRefill={() => creditsManager.emergencyRefill()}
        claimableMissionsCount={claimableMissionsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'image' && (
          <ImageStudio
            onSendToVideoStudio={handleSendToVideoStudio}
            onOpenShareModal={(c) => setShareCreation(c)}
            onOpenRoleta={() => setIsRoletaOpen(true)}
            onOpenPlans={() => setIsPlansOpen(true)}
            onCreationSaved={handleCreationSaved}
          />
        )}

        {currentTab === 'video' && (
          <VideoStudio
            initialImage={veoInitialImage}
            initialPrompt={veoInitialPrompt}
            onOpenShareModal={(c) => setShareCreation(c)}
            onOpenRoleta={() => setIsRoletaOpen(true)}
            onOpenPlans={() => setIsPlansOpen(true)}
            onCreationSaved={handleCreationSaved}
          />
        )}

        {currentTab === 'gallery' && (
          <Gallery
            creations={creations}
            onSelectCreation={(c) => setSelectedCreation(c)}
            onOpenShareModal={(c) => setShareCreation(c)}
            onSendToVideoStudio={handleSendToVideoStudio}
            onRefreshCreations={refreshCreations}
            onCreateNew={() => setCurrentTab('image')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🍌</span>
            <span className="font-bold text-zinc-300">Nano Banana 2.1 & Veo 3.1 Studio</span>
            <span>• Google AI Creative Suite</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>Alta Qualidade HD/4K</span>
            <span>Créditos Diários</span>
            <span>Galeria Local</span>
            <span>Google Veo Video AI</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RoletaWheel
        isOpen={isRoletaOpen}
        onClose={() => setIsRoletaOpen(false)}
        freeSpins={economy.freeSpinsLeft}
        userCredits={economy.credits}
      />

      <CalendarGamesModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onOpenRoleta={() => setIsRoletaOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
      />

      <MissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        missions={missions}
      />

      <PlansModal
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
        currentPlan={economy.vipPlanName}
        isVip={economy.isVip}
      />

      <ShareModal
        creation={shareCreation}
        onClose={() => setShareCreation(null)}
      />

      <CreationDetailModal
        creation={selectedCreation}
        onClose={() => setSelectedCreation(null)}
        onOpenShareModal={(c) => setShareCreation(c)}
        onSendToVideoStudio={handleSendToVideoStudio}
        onRefresh={refreshCreations}
      />
    </div>
  );
}
