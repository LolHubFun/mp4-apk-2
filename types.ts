export enum RenderStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface RenderConfig {
  visualFile: File | null;
  audioFile: File | null;
  fps: number;
  resolution: '480p' | '720p' | '1080p';
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}