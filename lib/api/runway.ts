// Runway API Client Implementation
// Uses verified types from types/runway.ts

import type { RunwayGenerateRequest, RunwayGenerateResponse } from '@/types/runway';
import { RUNWAY_CONFIG } from '@/lib/constants';

// Runway public API endpoint (not api.runwayml.com)
const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';

/**
 * Custom error class for Runway API errors with structured data
 */
export class RunwayAPIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public responseBody: unknown,
    message?: string
  ) {
    super(message || `Runway API error: ${status} - ${statusText}`);
    this.name = 'RunwayAPIError';
  }
}

/**
 * Internal request body structure for Runway text-to-video API
 */
interface RunwayTextToVideoRequest {
  model: string;
  promptText: string;
  duration: number;
  ratio: string;
  seed?: number;
  watermark?: boolean;
}

/**
 * Client for interacting with the Runway ML API
 * Handles video generation, status checking, and task cancellation
 */
export class RunwayClient {
  private apiSecret: string;

  /**
   * Creates a new Runway API client
   * @param apiSecret - Runway API secret key for authentication
   */
  constructor(apiSecret: string) {
    this.apiSecret = apiSecret;
  }

  /**
   * Makes an authenticated request to the Runway API
   * @param endpoint - API endpoint path (e.g., '/text_to_video')
   * @param options - Fetch options (method, body, etc.)
   * @returns Promise resolving to the Response object
   * @throws {RunwayAPIError} When the API returns an error status
   * @throws {Error} When the request times out after 30 seconds
   * @private
   */
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

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RUNWAY_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorBody: unknown;
        try {
          errorBody = JSON.parse(errorText);
        } catch {
          errorBody = errorText;
        }
        throw new RunwayAPIError(
          response.status,
          response.statusText,
          errorBody
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Runway API request timed out after ${RUNWAY_CONFIG.REQUEST_TIMEOUT_MS / 1000} seconds`);
      }
      throw error;
    }
  }

  /**
   * Generates a video using Runway's text-to-video API
   * @param params - Generation parameters including prompt, duration, and ratio
   * @returns Promise resolving to generation response with task ID and status
   * @throws {RunwayAPIError} When the API request fails
   * @example
   * ```typescript
   * const result = await client.generate({
   *   prompt: 'A serene lake at sunset',
   *   duration: 6,
   *   ratio: '16:9'
   * });
   * console.log(result.id); // Task ID for status checking
   * ```
   */
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

    const ratio = params.ratio ? (ratioMap[params.ratio] || RUNWAY_CONFIG.DEFAULT_RATIO) : RUNWAY_CONFIG.DEFAULT_RATIO;

    const requestBody: RunwayTextToVideoRequest = {
      model: 'veo3.1',
      promptText: params.prompt,
      duration: params.duration || RUNWAY_CONFIG.DEFAULT_DURATION_SECONDS,
      ratio: ratio,
      ...(params.seed !== undefined && { seed: params.seed }),
      ...(params.watermark !== undefined && { watermark: params.watermark }),
    };

    const response = await this.request('/text_to_video', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response.json();
  }

  /**
   * Checks the status of a video generation task
   * @param taskId - The task ID returned from the generate method
   * @returns Promise resolving to task status and progress information
   * @throws {RunwayAPIError} When the API request fails
   * @example
   * ```typescript
   * const status = await client.getStatus('task-abc-123');
   * if (status.status === 'SUCCEEDED') {
   *   console.log('Video URL:', status.output?.[0]);
   * }
   * ```
   */
  async getStatus(taskId: string): Promise<RunwayGenerateResponse> {
    const response = await this.request(`/tasks/${taskId}`, {
      method: 'GET',
    });

    return response.json();
  }

  /**
   * Cancels a running video generation task
   * @param taskId - The task ID to cancel
   * @returns Promise that resolves when the task is cancelled
   * @throws {RunwayAPIError} When the API request fails
   * @example
   * ```typescript
   * await client.cancel('task-abc-123');
   * console.log('Task cancelled successfully');
   * ```
   */
  async cancel(taskId: string): Promise<void> {
    await this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
let runwayClient: RunwayClient | null = null;

/**
 * Gets or creates a singleton instance of the Runway API client
 * Uses the RUNWAYML_API_SECRET environment variable for authentication
 * @returns RunwayClient instance
 * @throws {Error} When RUNWAYML_API_SECRET is not configured
 * @example
 * ```typescript
 * const client = getRunwayClient();
 * const result = await client.generate({ prompt: 'A beautiful sunset' });
 * ```
 */
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
