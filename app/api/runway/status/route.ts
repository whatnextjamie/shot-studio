import { NextRequest, NextResponse } from 'next/server';
import { getRunwayClient } from '@/lib/api/runway';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const client = getRunwayClient();
    const response = await client.getStatus(taskId);

    return NextResponse.json({
      taskId: response.id || response.taskId,
      status: response.status,
      progress: response.progress || response.progressRatio,
      progressText: response.progressText,
      videoUrl: response.artifacts?.[0]?.url || response.output?.[0],
      error: response.error || response.failure,
      estimatedTimeToStartSeconds: response.estimatedTimeToStartSeconds,
    });
  } catch (error) {
    console.error('Runway status error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    );
  }
}
