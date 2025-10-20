export interface Shot {
  id: string;
  number: number;
  duration: number; // Planned duration in seconds (Runway will generate as 5 or 10s)
  timing: {
    start: number;
    end: number;
  };
  description: string;
  runwayPrompt: string;
  cameraAngle: string;
  mood?: string;
  notes?: string;
  runwayTaskId?: string;
  runwayStatus?: 'PENDING' | 'SUCCEEDED' | 'FAILED'; // Matches Runway API status
  progressRatio?: number; // 0.0 to 1.0
  progressText?: string; // Status message from Runway
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Storyboard {
  id: string;
  title: string;
  description: string;
  totalDuration: number;
  shots: Shot[];
  style?: string;
  mood?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CanvasState {
  selectedShotId: string | null;
  isDragging: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
}