import type { Storyboard, Shot } from '@/types/storyboard';

export function parseStoryboardFromMessage(content: string): Storyboard | null {
  try {
    // Look for JSON block in the message - try multiple patterns
    let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);  // Try code block first

    if (!jsonMatch) {
      // Try to find raw JSON object
      jsonMatch = content.match(/\{[\s\S]*?"shots"\s*:\s*\[[\s\S]*?\]\s*[\s\S]*?\}/);
    }

    if (!jsonMatch) {
      return null;
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      throw parseError; // Re-throw to be caught by outer try-catch
    }

    // Validate required fields
    if (!data.shots || !Array.isArray(data.shots)) {
      return null;
    }

    // Calculate cumulative timing
    let currentStart = 0;
    const shots: Shot[] = data.shots.map((shot: any, index: number) => {
      const duration = shot.duration || 5;
      const timing = {
        start: currentStart,
        end: currentStart + duration,
      };
      currentStart += duration;

      return {
        id: crypto.randomUUID(),
        number: index + 1,
        duration,
        timing,
        description: shot.description || '',
        runwayPrompt: shot.runwayPrompt || shot.description || '',
        cameraAngle: shot.cameraAngle || 'Medium Shot',
        mood: shot.mood,
        notes: shot.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const storyboard: Storyboard = {
      id: crypto.randomUUID(),
      title: data.title || 'Untitled Storyboard',
      description: data.description || '',
      totalDuration: currentStart,
      shots,
      style: data.style,
      mood: data.mood,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return storyboard;
  } catch (error) {
    console.error('Error parsing storyboard:', error);
    return null;
  }
}

export function updateTiming(shots: Shot[]): Shot[] {
  let currentStart = 0;
  
  return shots.map((shot) => {
    const timing = {
      start: currentStart,
      end: currentStart + shot.duration,
    };
    currentStart += shot.duration;

    return {
      ...shot,
      timing,
      updatedAt: new Date(),
    };
  });
}