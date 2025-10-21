import { NextRequest, NextResponse } from 'next/server';
import { getRunwayClient } from '@/lib/api/runway';
import type { RunwayGenerateRequest } from '@/types/runway';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<RunwayGenerateRequest>;

    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const client = getRunwayClient();
    const response = await client.generate({
      prompt: body.prompt,
      duration: body.duration,
      ratio: body.ratio,
      watermark: body.watermark,
      image_url: body.image_url,
      seed: body.seed,
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
