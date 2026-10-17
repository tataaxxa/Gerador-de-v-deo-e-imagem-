export type MediaType = 'image' | 'video';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';

export type ImageResolution = 'HD' | 'Full HD' | '4K Ultra';
export type VideoResolution = '720p HD' | '1080p Full HD';

export type ImageModel = 'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image';
export type VideoModel = 'veo-3.1-lite-generate-preview';

export interface Creation {
  id: string;
  type: MediaType;
  title: string;
  prompt: string;
  enhancedPrompt?: string;
  mediaUrl: string; // Base64 data URL or Object URL or Blob
  thumbnailUrl?: string;
  aspectRatio: AspectRatio;
  resolution: string;
  model: string;
  style: string;
  views: number;
  likes: number;
  downloads: number;
  isFavorite: boolean;
  createdAt: number;
  duration?: number; // for video in seconds
  hasVoice?: boolean;
  voiceDialogue?: string;
  sourceImageId?: string; // if image-to-video
}

export interface UserEconomy {
  credits: number;
  isVip: boolean;
  vipPlanName?: string;
  vipExpiresAt?: number;
  totalGenerated: number;
  lastCheckinDate: string; // YYYY-MM-DD
  checkinStreak: number;
  freeSpinsLeft: number;
  lastSpinTimestamp: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  progress: number;
  totalRequired: number;
  isCompleted: boolean;
  isClaimed: boolean;
  category: 'daily' | 'achievement';
}

export interface PlanTier {
  id: string;
  name: string;
  badge: string;
  priceMonthly: string;
  creditsAllowance: string;
  creditsPerDay: number;
  highlight?: boolean;
  features: string[];
}
