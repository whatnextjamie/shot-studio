// Runway API Client Implementation
// Uses verified types from types/runway.ts (verified against official API docs)

import type { RunwayGenerateRequest, RunwayGenerateResponse } from '@/types/runway';

const RUNWAY_API_BASE = 'https://api.runwayml.com/v1';

export class RunwayClient {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${RUNWAY_API_BASE}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Runway-Secret': this.apiSecret,
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
    const response = await this.request('/generations', {
      method: 'POST',
      body: JSON.stringify({
        promptText: params.prompt,
        duration: params.duration || 5,
        ratio: params.ratio || '16:9',
        watermark: params.watermark,
        image_url: params.image_url,
        seed: params.seed,
      }),
    });

    return response.json();
  }

  async getStatus(taskId: string): Promise<RunwayGenerateResponse> {
    const response = await this.request(`/generations/${taskId}`, {
      method: 'GET',
    });

    return response.json();
  }

  async cancel(taskId: string): Promise<void> {
    await this.request(`/generations/${taskId}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
let runwayClient: RunwayClient | null = null;

export function getRunwayClient(): RunwayClient {
  if (!runwayClient) {
    const apiKey = process.env.RUNWAY_API_KEY;
    const apiSecret = process.env.RUNWAY_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Runway API credentials not configured');
    }

    runwayClient = new RunwayClient(apiKey, apiSecret);
  }

  return runwayClient;
}
