// Example React Query hooks for Runway API
// You'll implement these when integrating Runway in Weekend 2

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Shot } from '@/types/storyboard';

// Example: Query to check Runway task status
export function useRunwayTaskStatus(taskId: string | undefined) {
  return useQuery({
    queryKey: ['runway-task', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('No task ID');

      const response = await fetch(`/api/runway/status/${taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task status');
      return response.json();
    },
    enabled: !!taskId, // Only run if taskId exists
    refetchInterval: (data) => {
      // Poll every 3 seconds while task is pending
      return data?.status === 'PENDING' ? 3000 : false;
    },
  });
}

// Example: Mutation to generate video for a shot
export function useGenerateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shot: Shot) => {
      const response = await fetch('/api/runway/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: shot.runwayPrompt,
          duration: shot.duration,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate video');
      return response.json();
    },
    onSuccess: (data, shot) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['runway-task', data.taskId] });

      console.log('Video generation started for shot:', shot.id);
    },
    onError: (error) => {
      console.error('Error generating video:', error);
    },
  });
}

// Example usage:
// const { data, isLoading } = useRunwayTaskStatus(shot.runwayTaskId);
// const generateVideo = useGenerateVideo();
// generateVideo.mutate(shot);
