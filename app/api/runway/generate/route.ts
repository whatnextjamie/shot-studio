import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRunwayClient } from '@/lib/api/runway';
import { PROMPT_CONSTRAINTS, RUNWAY_CONFIG } from '@/lib/constants';
import type { RunwayGenerateRequest } from '@/types/runway';

export const runtime = 'edge';

// Zod schema for request validation
const generateSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(PROMPT_CONSTRAINTS.MAX_LENGTH, `Prompt must be ${PROMPT_CONSTRAINTS.MAX_LENGTH} characters or less`),
  duration: z.enum(['4', '6', '8']).or(z.number().refine(
    n => RUNWAY_CONFIG.VALID_DURATIONS.includes(n as 4 | 6 | 8),
    `Duration must be one of: ${RUNWAY_CONFIG.VALID_DURATIONS.join(', ')}`
  )).optional(),
  ratio: z.string().optional(),
  watermark: z.boolean().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  seed: z.number().int().min(0).max(2147483647).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body with Zod
    const validation = generateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => ({
            field: String(e.path.join('.')),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    const client = getRunwayClient();
    const response = await client.generate({
      prompt: validatedData.prompt,
      duration: validatedData.duration as 4 | 6 | 8 | undefined,
      ratio: validatedData.ratio as '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | '21:9' | undefined,
      watermark: validatedData.watermark,
      image_url: validatedData.image_url,
      seed: validatedData.seed,
    });

    return NextResponse.json({
      taskId: response.id || response.taskId,
      status: response.status,
      createdAt: response.createdAt,
    });
  } catch (error) {
    console.error('Runway generation error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
