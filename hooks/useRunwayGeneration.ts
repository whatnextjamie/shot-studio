import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStoryboardStore } from '@/store/storyboard-store';

interface RunwayStatusResponse {
  taskId: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'THROTTLED';
  progress?: number; // 0-1 when RUNNING (mapped from progressRatio by API route)
  progressText?: string;
  videoUrl?: string; // Already extracted by API route from artifacts or output
  error?: string;
  estimatedTimeToStartSeconds?: number;
}

/**
 * Hook for managing Runway video generation with React Query
 * - Uses useMutation for starting generation
 * - Uses useQuery with automatic polling for status updates
 * - Automatically syncs status to Zustand store
 */
export function useRunwayGeneration(shotId: string) {
  const queryClient = useQueryClient();
  const { updateShot } = useStoryboardStore();

  // Get the current shot to access taskId and duration
  const shot = useStoryboardStore((state) =>
    state.storyboard?.shots.find((s) => s.id === shotId)
  );

  // Mutation for starting generation
  const startGeneration = useMutation({
    mutationFn: async (prompt: string) => {
      // Veo 3.1 only accepts 4, 6, or 8 second durations
      // Map shot duration to nearest valid value
      const shotDuration = shot?.duration || 6;
      let duration: 4 | 6 | 8;
      if (shotDuration <= 5) {
        duration = 4;
      } else if (shotDuration <= 7) {
        duration = 6;
      } else {
        duration = 8;
      }

      const response = await fetch('/api/runway/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          duration,
          ratio: '1280:720', // Runway requires pixel dimensions, not aspect ratio
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start generation');
      }

      const data = await response.json();
      return {
        taskId: data.taskId || data.id,
      };
    },
    onMutate: () => {
      // Update shot status immediately when starting
      updateShot(shotId, {
        runwayStatus: 'PENDING',
      });
    },
    onSuccess: (data) => {
      // Store task ID in shot
      updateShot(shotId, {
        runwayTaskId: data.taskId,
        runwayStatus: 'PENDING',
      });
    },
    onError: (error) => {
      console.error('Generation start error:', error);
      updateShot(shotId, {
        runwayStatus: 'FAILED',
      });
    },
  });

  // Query for polling status (only runs when we have a taskId and generation is pending)
  const statusQuery = useQuery<RunwayStatusResponse>({
    queryKey: ['runway-status', shot?.runwayTaskId],
    queryFn: async () => {
      const response = await fetch(
        `/api/runway/status?taskId=${shot!.runwayTaskId}`
      );

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      return response.json();
    },
    enabled: !!shot?.runwayTaskId && !['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(shot?.runwayStatus || ''),
    refetchInterval: (query) => {
      // Stop polling if succeeded, failed, or cancelled
      const data = query.state.data;
      if (data?.status === 'SUCCEEDED' || data?.status === 'FAILED' || data?.status === 'CANCELLED') {
        return false;
      }
      // Poll every 3 seconds while pending/running/throttled
      return 3000;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Effect to sync status query results to Zustand store
  useEffect(() => {
    if (!statusQuery.data || !shot?.runwayTaskId) return;

    const data = statusQuery.data;

    if (data.status === 'SUCCEEDED') {
      const videoUrl = data.videoUrl;

      updateShot(shotId, {
        runwayStatus: 'SUCCEEDED',
        videoUrl,
        progressRatio: 1.0,
      });

      // Invalidate query to stop polling
      queryClient.invalidateQueries({
        queryKey: ['runway-status', shot.runwayTaskId],
      });
    } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
      updateShot(shotId, {
        runwayStatus: 'FAILED',
      });

      // Invalidate query to stop polling
      queryClient.invalidateQueries({
        queryKey: ['runway-status', shot.runwayTaskId],
      });
    } else if (data.status === 'RUNNING' || data.status === 'PENDING' || data.status === 'THROTTLED') {
      // Update progress while running/pending
      updateShot(shotId, {
        runwayStatus: data.status,
        progressRatio: data.progress || 0,
      });
    }
  }, [statusQuery.data, shotId, updateShot, shot?.runwayTaskId, queryClient]);

  return {
    generate: startGeneration.mutate,
    isGenerating: startGeneration.isPending || ['PENDING', 'RUNNING', 'THROTTLED'].includes(shot?.runwayStatus || ''),
    progressRatio: shot?.progressRatio || 0,
    progressText: shot?.progressText,
    error: startGeneration.error?.message || statusQuery.error?.message || null,
    cancel: () => {
      // Cancel ongoing requests and reset state
      queryClient.cancelQueries({
        queryKey: ['runway-status', shot?.runwayTaskId],
      });
      startGeneration.reset();
    },
  };
}