import { UserEconomy, Mission, PlanTier } from '../types';

const ECONOMY_KEY = 'nano_banana_economy_v1';
const MISSIONS_KEY = 'nano_banana_missions_v1';

export const INITIAL_ECONOMY: UserEconomy = {
  credits: 500, // Generous welcome gift of 500 credits!
  isVip: false,
  totalGenerated: 0,
  lastCheckinDate: '',
  checkinStreak: 0,
  freeSpinsLeft: 5, // 5 free spins
  lastSpinTimestamp: 0,
};

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'gen_first_image',
    title: '🍌 Criador Estelar Banana',
    description: 'Gere sua primeira imagem HD com Nano Banana 2.1',
    rewardCredits: 35,
    progress: 0,
    totalRequired: 1,
    isCompleted: false,
    isClaimed: false,
    category: 'daily',
  },
  {
    id: 'enhance_prompt',
    title: '✨ Alquimista de Prompts',
    description: 'Use o Banana Magic Prompt para aprimorar uma ideia',
    rewardCredits: 20,
    progress: 0,
    totalRequired: 1,
    isCompleted: false,
    isClaimed: false,
    category: 'daily',
  },
  {
    id: 'gen_veo_video',
    title: '🎬 Diretor de Cinema Veo',
    description: 'Crie seu primeiro vídeo cinematográfico com Veo 3.1 Lite',
    rewardCredits: 60,
    progress: 0,
    totalRequired: 1,
    isCompleted: false,
    isClaimed: false,
    category: 'daily',
  },
  {
    id: 'spin_wheel',
    title: '🎰 Sorte Dourada Banana',
    description: 'Gire a Roleta da Sorte Diária hoje',
    rewardCredits: 25,
    progress: 0,
    totalRequired: 1,
    isCompleted: false,
    isClaimed: false,
    category: 'daily',
  },
  {
    id: 'share_social',
    title: '📢 Viral nas Redes',
    description: 'Compartilhe uma imagem ou vídeo diretamente nas redes',
    rewardCredits: 30,
    progress: 0,
    totalRequired: 1,
    isCompleted: false,
    isClaimed: false,
    category: 'daily',
  },
  {
    id: 'collect_views',
    title: '🔥 Sensação da Galeria',
    description: 'Alcance 5 visualizações em suas criações da galeria',
    rewardCredits: 50,
    progress: 0,
    totalRequired: 5,
    isCompleted: false,
    isClaimed: false,
    category: 'achievement',
  },
];

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'free',
    name: 'Banana Starter',
    badge: 'Grátis',
    priceMonthly: 'R$ 0,00',
    creditsAllowance: '150 créditos / dia',
    creditsPerDay: 150,
    features: [
      'Resolução padrão 1K / HD',
      'Nano Banana 2.1 Padrão',
      'Roleta da Sorte Diária',
      'Galeria Local Ilimitada',
      'Download e Compartilhamento',
    ],
  },
  {
    id: 'pro',
    name: 'Banana Pro Creator',
    badge: '100% Grátis VIP 🔥',
    priceMonthly: 'R$ 0,00 (Gratuito)',
    creditsAllowance: '1.500 créditos diários + Bônus',
    creditsPerDay: 1500,
    highlight: true,
    features: [
      'Geração Full HD 2K e 4K Ultra sem limites',
      'Veo 3.1 Lite com prioridade de fila',
      'Modo Imagem-para-Vídeo avançado',
      '10 giros na Roleta da Sorte diários',
      'Selo Banana VIP Ouro no perfil',
      'Download sem marca d’água',
      '+1.500 créditos imediatos ao ativar',
    ],
  },
  {
    id: 'ultra',
    name: 'Google Veo Ultra VIP',
    badge: 'VIP Total Grátis 👑',
    priceMonthly: 'R$ 0,00 (Gratuito)',
    creditsAllowance: 'Créditos Ilimitados ✨',
    creditsPerDay: 9999,
    features: [
      'Gerações 100% Ilimitadas sem consumir créditos',
      'Veo 3.1 Lite em 1080p Full HD Instantâneo',
      'Controles de Câmera 3D Profissionais',
      'Aprimorador de Prompts Gemini Ilimitado',
      'Acesso antecipado aos novos modelos Google AI',
      'Suporte VIP prioritário',
      '+5.000 créditos imediatos ao ativar',
    ],
  },
];

type EconomyListener = (economy: UserEconomy) => void;
type MissionsListener = (missions: Mission[]) => void;

class CreditsManager {
  private economy: UserEconomy;
  private missions: Mission[];
  private economyListeners: Set<EconomyListener> = new Set();
  private missionsListeners: Set<MissionsListener> = new Set();

  constructor() {
    this.economy = this.loadEconomy();
    this.missions = this.loadMissions();
    this.checkDayReset();
  }

  private loadEconomy(): UserEconomy {
    try {
      const data = localStorage.getItem(ECONOMY_KEY);
      if (data) {
        return { ...INITIAL_ECONOMY, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Erro ao carregar economia:', e);
    }
    return { ...INITIAL_ECONOMY };
  }

  private loadMissions(): Mission[] {
    try {
      const data = localStorage.getItem(MISSIONS_KEY);
      if (data) {
        const stored = JSON.parse(data);
        return INITIAL_MISSIONS.map(def => {
          const found = stored.find((m: Mission) => m.id === def.id);
          return found ? { ...def, ...found } : def;
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar missões:', e);
    }
    return [...INITIAL_MISSIONS];
  }

  private save() {
    try {
      localStorage.setItem(ECONOMY_KEY, JSON.stringify(this.economy));
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(this.missions));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
    this.notify();
  }

  private notify() {
    this.economyListeners.forEach(fn => fn(this.economy));
    this.missionsListeners.forEach(fn => fn(this.missions));
  }

  private checkDayReset() {
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = this.economy.lastCheckinDate;
    
    // Reset daily spins if it's a new day
    const lastSpinDay = this.economy.lastSpinTimestamp 
      ? new Date(this.economy.lastSpinTimestamp).toISOString().split('T')[0] 
      : '';

    if (lastSpinDay !== today) {
      this.economy.freeSpinsLeft = this.economy.isVip ? 5 : 2;
      this.save();
    }
  }

  public getEconomy(): UserEconomy {
    return { ...this.economy };
  }

  public getMissions(): Mission[] {
    return [...this.missions];
  }

  public subscribeEconomy(fn: EconomyListener): () => void {
    this.economyListeners.add(fn);
    fn(this.economy);
    return () => this.economyListeners.delete(fn);
  }

  public subscribeMissions(fn: MissionsListener): () => void {
    this.missionsListeners.add(fn);
    fn(this.missions);
    return () => this.missionsListeners.delete(fn);
  }

  public hasSufficientCredits(cost: number): boolean {
    if (this.economy.isVip && this.economy.vipPlanName === 'ultra') return true;
    return this.economy.credits >= cost;
  }

  public spendCredits(cost: number, reason: string): boolean {
    if (this.economy.isVip && this.economy.vipPlanName === 'ultra') {
      this.economy.totalGenerated += 1;
      this.save();
      return true;
    }

    if (this.economy.credits < cost) {
      return false;
    }

    this.economy.credits -= cost;
    this.economy.totalGenerated += 1;
    this.save();
    return true;
  }

  public addCredits(amount: number, reason: string = 'Recompensa') {
    this.economy.credits += amount;
    this.save();
  }

  // Daily Check-in Streak System
  public performDailyCheckin(): { success: boolean; reward: number; streak: number; message: string } {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (this.economy.lastCheckinDate === today) {
      return {
        success: false,
        reward: 0,
        streak: this.economy.checkinStreak,
        message: 'Você já resgatou o check-in de hoje! Volte amanhã para continuar o combo.',
      };
    }

    let newStreak = 1;
    if (this.economy.lastCheckinDate === yesterday) {
      newStreak = (this.economy.checkinStreak % 7) + 1;
    }

    // Streak rewards table
    const rewards = [50, 75, 100, 120, 150, 200, 500];
    const reward = rewards[(newStreak - 1) % rewards.length];

    this.economy.lastCheckinDate = today;
    this.economy.checkinStreak = newStreak;
    this.economy.credits += reward;
    this.economy.freeSpinsLeft += 1; // Bonus spin on checkin
    this.save();

    return {
      success: true,
      reward,
      streak: newStreak,
      message: `Dia ${newStreak} resgatado com sucesso! +${reward} Créditos Banana e +1 Giro de Roleta!`,
    };
  }

  // Spin Roleta
  public spinRoleta(prizeCredits: number): { success: boolean; message: string } {
    if (this.economy.freeSpinsLeft <= 0 && this.economy.credits < 10) {
      return {
        success: false,
        message: 'Sem giros grátis suficientes! Você precisa de pelo menos 10 créditos para um giro extra.',
      };
    }

    if (this.economy.freeSpinsLeft > 0) {
      this.economy.freeSpinsLeft -= 1;
    } else {
      this.economy.credits -= 10;
    }

    this.economy.credits += prizeCredits;
    this.economy.lastSpinTimestamp = Date.now();
    this.save();

    // Trigger mission
    this.advanceMission('spin_wheel', 1);

    return {
      success: true,
      message: `Você ganhou +${prizeCredits} Créditos Banana na Roleta da Sorte!`,
    };
  }

  // Mission progression
  public advanceMission(missionId: string, amount: number = 1) {
    let changed = false;
    this.missions = this.missions.map(m => {
      if (m.id === missionId && !m.isCompleted) {
        const newProgress = Math.min(m.totalRequired, m.progress + amount);
        const isCompleted = newProgress >= m.totalRequired;
        changed = true;
        return {
          ...m,
          progress: newProgress,
          isCompleted,
        };
      }
      return m;
    });

    if (changed) {
      this.save();
    }
  }

  // Claim mission reward
  public claimMissionReward(missionId: string): number {
    let reward = 0;
    this.missions = this.missions.map(m => {
      if (m.id === missionId && m.isCompleted && !m.isClaimed) {
        reward = m.rewardCredits;
        return { ...m, isClaimed: true };
      }
      return m;
    });

    if (reward > 0) {
      this.economy.credits += reward;
      this.save();
    }

    return reward;
  }


  // Subscribe to VIP plan (100% Free VIP promo)
  public setPlan(planId: string) {
    if (planId === 'ultra') {
      this.economy.isVip = true;
      this.economy.vipPlanName = 'ultra';
      this.economy.credits += 5000;
      this.economy.freeSpinsLeft += 20;
    } else if (planId === 'pro') {
      this.economy.isVip = true;
      this.economy.vipPlanName = 'pro';
      this.economy.credits += 2000;
      this.economy.freeSpinsLeft += 10;
    } else {
      this.economy.isVip = false;
      this.economy.vipPlanName = undefined;
    }
    this.save();
  }

  // Instant emergency recharge button (generous +350 credits)
  public emergencyRefill() {
    this.economy.credits += 350;
    this.save();
  }
}

export const creditsManager = new CreditsManager();
