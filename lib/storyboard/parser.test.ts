import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseStoryboardFromMessage, updateTiming } from './parser';
import type { Shot } from '@/types/storyboard';

describe('parseStoryboardFromMessage', () => {
  beforeEach(() => {
    // Mock crypto.randomUUID to make tests deterministic
    vi.stubGlobal('crypto', {
      randomUUID: () => 'test-uuid-123',
    });
  });

  describe('Valid JSON parsing', () => {
    it('should parse valid JSON in markdown code block', () => {
      const message = `
Here's your storyboard:
\`\`\`json
{
  "title": "Test Storyboard",
  "description": "A test description",
  "shots": [
    {
      "description": "Opening scene",
      "duration": 10,
      "cameraAngle": "Wide Shot",
      "mood": "mysterious"
    }
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Storyboard');
      expect(result?.description).toBe('A test description');
      expect(result?.shots).toHaveLength(1);
      expect(result?.shots[0].description).toBe('Opening scene');
      expect(result?.shots[0].duration).toBe(10);
      expect(result?.shots[0].cameraAngle).toBe('Wide Shot');
      expect(result?.shots[0].mood).toBe('mysterious');
    });

    it('should parse valid JSON without markdown code block', () => {
      const message = `
{
  "title": "Test Storyboard",
  "shots": [
    {
      "description": "Scene 1",
      "duration": 5
    }
  ]
}
`;
      const result = parseStoryboardFromMessage(message);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Storyboard');
      expect(result?.shots).toHaveLength(1);
    });

    it('should parse JSON with multiple shots', () => {
      const message = `
\`\`\`json
{
  "title": "Multi-shot",
  "shots": [
    {"description": "Shot 1", "duration": 5},
    {"description": "Shot 2", "duration": 10},
    {"description": "Shot 3", "duration": 7}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots).toHaveLength(3);
      expect(result?.totalDuration).toBe(22);
    });
  });

  describe('Default values', () => {
    it('should use default duration of 5 when not provided', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Scene without duration"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].duration).toBe(5);
    });

    it('should use default cameraAngle of "Medium Shot" when not provided', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Scene without camera angle"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].cameraAngle).toBe('Medium Shot');
    });

    it('should use default title "Untitled Storyboard" when not provided', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Scene 1"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.title).toBe('Untitled Storyboard');
    });

    it('should use empty string for description when not provided', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Scene 1"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.description).toBe('');
      expect(result?.shots[0].description).toBe('Scene 1');
    });

    it('should use shot description as runwayPrompt when runwayPrompt not provided', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "A beautiful sunset"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].runwayPrompt).toBe('A beautiful sunset');
    });

    it('should use provided runwayPrompt over description when both exist', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {
      "description": "A sunset",
      "runwayPrompt": "Cinematic sunset with golden hour lighting"
    }
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].runwayPrompt).toBe('Cinematic sunset with golden hour lighting');
      expect(result?.shots[0].description).toBe('A sunset');
    });
  });

  describe('Timing calculations', () => {
    it('should calculate cumulative timing correctly', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Shot 1", "duration": 5},
    {"description": "Shot 2", "duration": 10},
    {"description": "Shot 3", "duration": 3}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].timing).toEqual({ start: 0, end: 5 });
      expect(result?.shots[1].timing).toEqual({ start: 5, end: 15 });
      expect(result?.shots[2].timing).toEqual({ start: 15, end: 18 });
      expect(result?.totalDuration).toBe(18);
    });

    it('should handle timing with default durations', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Shot 1"},
    {"description": "Shot 2"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].timing).toEqual({ start: 0, end: 5 });
      expect(result?.shots[1].timing).toEqual({ start: 5, end: 10 });
      expect(result?.totalDuration).toBe(10);
    });
  });

  describe('Shot properties', () => {
    it('should assign sequential shot numbers starting from 1', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Shot 1"},
    {"description": "Shot 2"},
    {"description": "Shot 3"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].number).toBe(1);
      expect(result?.shots[1].number).toBe(2);
      expect(result?.shots[2].number).toBe(3);
    });

    it('should generate UUIDs for shots', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Shot 1"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].id).toBe('test-uuid-123');
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const before = new Date();
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Shot 1"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);
      const after = new Date();

      expect(result?.shots[0].createdAt).toBeInstanceOf(Date);
      expect(result?.shots[0].updatedAt).toBeInstanceOf(Date);
      expect(result?.shots[0].createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result?.shots[0].createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should preserve optional fields when provided', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {
      "description": "Shot 1",
      "mood": "tense",
      "notes": "Use dramatic lighting"
    }
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].mood).toBe('tense');
      expect(result?.shots[0].notes).toBe('Use dramatic lighting');
    });

    it('should preserve storyboard optional fields', () => {
      const message = `
\`\`\`json
{
  "title": "Test",
  "style": "noir",
  "mood": "dark",
  "shots": [
    {"description": "Shot 1"}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.style).toBe('noir');
      expect(result?.mood).toBe('dark');
    });
  });

  describe('Error handling', () => {
    it('should return null for invalid JSON', () => {
      const message = `
\`\`\`json
{
  "title": "Invalid
  "shots": [
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result).toBeNull();
    });

    it('should return null when no JSON is found', () => {
      const message = 'This is just a regular message with no JSON';
      const result = parseStoryboardFromMessage(message);

      expect(result).toBeNull();
    });

    it('should return null when shots array is missing', () => {
      const message = `
\`\`\`json
{
  "title": "No shots",
  "description": "This has no shots array"
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result).toBeNull();
    });

    it('should return null when shots is not an array', () => {
      const message = `
\`\`\`json
{
  "title": "Invalid shots",
  "shots": "not an array"
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result).toBeNull();
    });

    it('should handle empty shots array', () => {
      const message = `
\`\`\`json
{
  "title": "Empty",
  "shots": []
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result).not.toBeNull();
      expect(result?.shots).toHaveLength(0);
      expect(result?.totalDuration).toBe(0);
    });

    it('should log error to console on parsing failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Use malformed JSON that will trigger the catch block
      const message = `\`\`\`json
{"title": "Invalid", "shots": [}
\`\`\``;

      parseStoryboardFromMessage(message);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing storyboard:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle JSON with extra whitespace', () => {
      const message = `
\`\`\`json


{
  "title": "Whitespace Test",
  "shots": [
    {"description": "Shot 1"}
  ]
}


\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Whitespace Test');
    });

    it('should treat duration of 0 as default duration of 5', () => {
      // Note: The parser uses `shot.duration || 5`, so 0 is treated as falsy
      const message = `
\`\`\`json
{
  "shots": [
    {"description": "Shot 1", "duration": 0},
    {"description": "Shot 2", "duration": 10}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      // Duration of 0 is converted to default 5
      expect(result?.shots[0].duration).toBe(5);
      expect(result?.shots[0].timing).toEqual({ start: 0, end: 5 });
      expect(result?.shots[1].timing).toEqual({ start: 5, end: 15 });
    });

    it('should handle empty description', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"description": ""}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].description).toBe('');
      expect(result?.shots[0].runwayPrompt).toBe('');
    });

    it('should handle missing description field', () => {
      const message = `
\`\`\`json
{
  "shots": [
    {"duration": 5}
  ]
}
\`\`\`
`;
      const result = parseStoryboardFromMessage(message);

      expect(result?.shots[0].description).toBe('');
    });
  });
});

describe('updateTiming', () => {
  it('should update timing for multiple shots', () => {
    const shots: Shot[] = [
      {
        id: '1',
        number: 1,
        duration: 5,
        timing: { start: 0, end: 5 },
        description: 'Shot 1',
        runwayPrompt: 'Prompt 1',
        cameraAngle: 'Wide',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        number: 2,
        duration: 10,
        timing: { start: 5, end: 15 },
        description: 'Shot 2',
        runwayPrompt: 'Prompt 2',
        cameraAngle: 'Close-up',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const result = updateTiming(shots);

    expect(result[0].timing).toEqual({ start: 0, end: 5 });
    expect(result[1].timing).toEqual({ start: 5, end: 15 });
  });

  it('should recalculate timing when durations change', () => {
    const shots: Shot[] = [
      {
        id: '1',
        number: 1,
        duration: 8, // Changed from 5
        timing: { start: 0, end: 5 }, // Old timing
        description: 'Shot 1',
        runwayPrompt: 'Prompt 1',
        cameraAngle: 'Wide',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        number: 2,
        duration: 12, // Changed from 10
        timing: { start: 5, end: 15 }, // Old timing
        description: 'Shot 2',
        runwayPrompt: 'Prompt 2',
        cameraAngle: 'Close-up',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const result = updateTiming(shots);

    expect(result[0].timing).toEqual({ start: 0, end: 8 });
    expect(result[1].timing).toEqual({ start: 8, end: 20 });
  });

  it('should handle empty array', () => {
    const shots: Shot[] = [];
    const result = updateTiming(shots);

    expect(result).toHaveLength(0);
  });

  it('should handle single shot', () => {
    const shots: Shot[] = [
      {
        id: '1',
        number: 1,
        duration: 7,
        timing: { start: 0, end: 0 },
        description: 'Solo shot',
        runwayPrompt: 'Prompt',
        cameraAngle: 'Medium',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const result = updateTiming(shots);

    expect(result[0].timing).toEqual({ start: 0, end: 7 });
  });

  it('should update updatedAt timestamp', () => {
    const oldDate = new Date('2024-01-01');
    const before = new Date();

    const shots: Shot[] = [
      {
        id: '1',
        number: 1,
        duration: 5,
        timing: { start: 0, end: 5 },
        description: 'Shot 1',
        runwayPrompt: 'Prompt 1',
        cameraAngle: 'Wide',
        createdAt: oldDate,
        updatedAt: oldDate,
      },
    ];

    const result = updateTiming(shots);
    const after = new Date();

    expect(result[0].updatedAt).toBeInstanceOf(Date);
    expect(result[0].updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result[0].updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(result[0].updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
  });

  it('should preserve all other shot properties', () => {
    const shots: Shot[] = [
      {
        id: 'unique-id',
        number: 1,
        duration: 5,
        timing: { start: 0, end: 5 },
        description: 'Test shot',
        runwayPrompt: 'Test prompt',
        cameraAngle: 'Wide Shot',
        mood: 'happy',
        notes: 'Important notes',
        runwayTaskId: 'task-123',
        runwayStatus: 'SUCCEEDED',
        progressRatio: 1.0,
        progressText: 'Complete',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const result = updateTiming(shots);

    expect(result[0].id).toBe('unique-id');
    expect(result[0].number).toBe(1);
    expect(result[0].description).toBe('Test shot');
    expect(result[0].runwayPrompt).toBe('Test prompt');
    expect(result[0].cameraAngle).toBe('Wide Shot');
    expect(result[0].mood).toBe('happy');
    expect(result[0].notes).toBe('Important notes');
    expect(result[0].runwayTaskId).toBe('task-123');
    expect(result[0].runwayStatus).toBe('SUCCEEDED');
    expect(result[0].progressRatio).toBe(1.0);
    expect(result[0].progressText).toBe('Complete');
    expect(result[0].videoUrl).toBe('https://example.com/video.mp4');
    expect(result[0].thumbnailUrl).toBe('https://example.com/thumb.jpg');
  });

  it('should handle shots with duration of 0', () => {
    const shots: Shot[] = [
      {
        id: '1',
        number: 1,
        duration: 0,
        timing: { start: 0, end: 0 },
        description: 'Zero duration',
        runwayPrompt: 'Prompt',
        cameraAngle: 'Medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        number: 2,
        duration: 5,
        timing: { start: 0, end: 0 },
        description: 'Normal duration',
        runwayPrompt: 'Prompt',
        cameraAngle: 'Medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = updateTiming(shots);

    expect(result[0].timing).toEqual({ start: 0, end: 0 });
    expect(result[1].timing).toEqual({ start: 0, end: 5 });
  });

  it('should handle large numbers of shots efficiently', () => {
    const shots: Shot[] = Array.from({ length: 100 }, (_, i) => ({
      id: `shot-${i}`,
      number: i + 1,
      duration: 5,
      timing: { start: 0, end: 0 },
      description: `Shot ${i + 1}`,
      runwayPrompt: `Prompt ${i + 1}`,
      cameraAngle: 'Medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = updateTiming(shots);

    expect(result).toHaveLength(100);
    expect(result[0].timing).toEqual({ start: 0, end: 5 });
    expect(result[50].timing).toEqual({ start: 250, end: 255 });
    expect(result[99].timing).toEqual({ start: 495, end: 500 });
  });
});
