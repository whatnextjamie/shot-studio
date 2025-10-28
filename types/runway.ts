// NOTE: These types match the official Runway API documentation
// Verified against API docs at https://docs.dev.runwayml.com/
// Last verified: 2025-10-19

export interface RunwayGenerateRequest {
  prompt: string; // Required, max 1000 UTF-16 code points
  duration?: 4 | 6 | 8; // Duration in seconds for Veo 3.1, default 6
  ratio?: '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | '21:9';
  watermark?: boolean;
  image_url?: string; // HTTPS URL or data URI for first frame (image-to-video)
  seed?: number; // For reproducible results
}

export interface RunwayGenerateResponse {
  id: string;
  taskId?: string; // Alternative task identifier
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'THROTTLED';
  createdAt: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
  progress?: number; // 0.0 to 1.0 - used during RUNNING status
  progressRatio?: number; // Alternative progress field
  progressText?: string;
  estimatedTimeToStartSeconds?: number;
  artifacts?: Array<{ url: string }>; // Primary output location when SUCCEEDED
  output?: string[]; // Alternative output URLs
  failure?: string; // Error message when FAILED
  failureCode?: string;
  error?: string;
}

export interface RunwayTask {
  id: string;
  shotId: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  progressRatio: number;
  progressText?: string;
  videoUrl?: string;
  error?: string;
}