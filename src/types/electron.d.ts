import { AspectRatio, Slide, SlideMaster } from './presentation';

export interface AudienceSyncPayload {
  slide: Slide;
  slideIndex: number;
  aspectRatio: AspectRatio;
  master: SlideMaster;
  blackout: boolean;
  animTime: number;
  reduceMotion: boolean;
}

export interface ElectronDisplayInfo {
  id: number;
  label: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export interface DesktopBridge {
  isDesktop: boolean;
  isElectron: boolean;
  platform: string;
  openProjectDialog: () => Promise<{ filePath: string; content: string } | null>;
  saveProjectDialog: (suggestedName: string, content: string) => Promise<boolean>;
  listDisplays: () => Promise<ElectronDisplayInfo[]>;
  openPresenterDisplay: (
    initialPayload: AudienceSyncPayload,
  ) => Promise<{ opened: boolean; external: boolean }>;
  syncAudienceDisplay: (payload: AudienceSyncPayload) => void;
  closePresenterDisplay: () => Promise<boolean>;
  onMenuAction: (callback: (action: 'open' | 'save' | 'present' | 'rehearse') => void) => () => void;
  onAudienceSync: (callback: (payload: AudienceSyncPayload) => void) => () => void;
  onAudienceClosed: (callback: () => void) => () => void;
}

export type ElectronAPI = DesktopBridge;

declare global {
  interface Window {
    desktop?: DesktopBridge;
    electronAPI?: DesktopBridge;
  }
}
