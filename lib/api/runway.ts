// Runway API Client Implementation
// Uses verified types from types/runway.ts

import type { RunwayGenerateRequest, RunwayGenerateResponse } from '@/types/runway';

// Runway public API endpoint (not api.runwayml.com)
const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';

export class RunwayClient {
  private apiSecret: string;

  constructor(apiSecret: string) {
    this.apiSecret = apiSecret;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${RUNWAY_API_BASE}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiSecret}`,
      'X-Runway-Version': '2024-11-06', // API version header required by Runway
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Runway API error: ${response.status} - ${error}`);
    }

    return response;
  }

  async generate(params: RunwayGenerateRequest): Promise<RunwayGenerateResponse> {
    // Map to Runway's pixel dimension format for veo3.1
    // veo3.1 supports: 1280:720, 720:1280, and other standard ratios
    const ratioMap: Record<string, string> = {
      '16:9': '1280:720',
      '9:16': '720:1280',
      '4:3': '1280:720',    // Closest match
      '3:4': '720:1280',    // Closest match
      '1:1': '1280:720',    // Closest match
      '21:9': '1280:720',   // Closest match
      // Pass through if already in pixel format
      '1280:720': '1280:720',
      '720:1280': '720:1280',
      '1920:1080': '1920:1080',
      '1080:1920': '1080:1920',
    };

    const ratio = params.ratio ? (ratioMap[params.ratio] || '1280:720') : '1280:720';

    const requestBody: any = {
      model: 'veo3.1',
      promptText: params.prompt,
      duration: params.duration || 6,  // Default to 6s (valid values: 4, 6, 8)
      ratio: ratio,
    };

    // Add optional parameters if provided
    if (params.seed !== undefined) {
      requestBody.seed = params.seed;
    }
    if (params.watermark !== undefined) {
      requestBody.watermark = params.watermark;
    }

    const response = await this.request('/text_to_video', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response.json();
  }

  async getStatus(taskId: string): Promise<RunwayGenerateResponse> {
    const response = await this.request(`/tasks/${taskId}`, {
      method: 'GET',
    });

    return response.json();
  }

  async cancel(taskId: string): Promise<void> {
    await this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
let runwayClient: RunwayClient | null = null;

export function getRunwayClient(): RunwayClient {
  if (!runwayClient) {
    // Runway provides a single API secret for Bearer token authentication
    const apiSecret = process.env.RUNWAYML_API_SECRET;

    if (!apiSecret) {
      throw new Error('Runway API credentials not configured');
    }

    runwayClient = new RunwayClient(apiSecret);
  }

  return runwayClient;
}
