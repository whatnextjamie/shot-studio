import type { Storyboard, Shot } from '@/types/storyboard';

/**
 * Raw shot data from AI response before transformation
 */
interface RawShotData {
  description?: string;
  runwayPrompt?: string;
  cameraAngle?: string;
  duration?: number;
  mood?: string;
  notes?: string;
}

/**
 * Raw storyboard data from AI response
 */
interface RawStoryboardData {
  title?: string;
  description?: string;
  style?: string;
  mood?: string;
  shots: RawShotData[];
}

/**
 * Parses a storyboard from an AI assistant message
 * Looks for JSON blocks containing shot definitions and converts them to a Storyboard
 * @param content - Raw message content from the AI assistant
 * @returns Parsed Storyboard object or null if parsing fails
 * @example
 * ```typescript
 * const message = '```json\n{ "title": "My Story", "shots": [...] }\n```';
 * const storyboard = parseStoryboardFromMessage(message);
 * if (storyboard) {
 *   console.log(`Parsed ${storyboard.shots.length} shots`);
 * }
 * ```
 */
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

    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      throw parseError; // Re-throw to be caught by outer try-catch
    }

    // Type guard: validate required fields
    if (!data || typeof data !== 'object' || !('shots' in data) || !Array.isArray((data as RawStoryboardData).shots)) {
      return null;
    }

    // Now we can safely cast to RawStoryboardData
    const storyboardData = data as RawStoryboardData;

    // Calculate cumulative timing
    let currentStart = 0;
    const shots: Shot[] = storyboardData.shots.map((shot: RawShotData, index: number) => {
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
      title: storyboardData.title || 'Untitled Storyboard',
      description: storyboardData.description || '',
      totalDuration: currentStart,
      shots,
      style: storyboardData.style,
      mood: storyboardData.mood,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return storyboard;
  } catch (error) {
    console.error('Error parsing storyboard:', error);
    return null;
  }
}

/**
 * Recalculates cumulative timing for an array of shots
 * Used when shots are reordered or durations change
 * @param shots - Array of shots to update
 * @returns New array with updated timing values
 * @example
 * ```typescript
 * const reorderedShots = [...shots];
 * reorderedShots.reverse();
 * const updated = updateTiming(reorderedShots);
 * console.log(updated[0].timing); // { start: 0, end: 5 }
 * ```
 */
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