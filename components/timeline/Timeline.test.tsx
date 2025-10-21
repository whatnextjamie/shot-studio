import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Storyboard } from '@/types/storyboard';
import Timeline from './Timeline';

// Create mocks using vi.hoisted to avoid hoisting issues
const { mockStoreState, mockReorderShots, mockUpdateTiming } = vi.hoisted(() => ({
  mockStoreState: {
    storyboard: null as Storyboard | null,
  },
  mockReorderShots: vi.fn(),
  mockUpdateTiming: vi.fn(),
}));

// Mock the store
vi.mock('@/store/storyboard-store', () => ({
  useStoryboardStore: (selector: any) => {
    const state = {
      storyboard: mockStoreState.storyboard,
      reorderShots: mockReorderShots,
    };
    return selector(state);
  },
}));

// Mock the parser
vi.mock('@/lib/storyboard/parser', () => ({
  updateTiming: mockUpdateTiming,
}));

// Mock TimelineShot component
vi.mock('./TimelineShot', () => ({
  default: ({ shot }: any) => (
    <div data-testid={`timeline-shot-${shot.id}`}>
      Shot {shot.number}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Clock: ({ size, className }: any) => (
    <div data-testid="clock-icon" data-size={size} className={className} />
  ),
}));

// Store the onDragEnd handler so we can call it in tests
let mockOnDragEnd: ((event: any) => void) | null = null;

// Mock @dnd-kit components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => {
    mockOnDragEnd = onDragEnd;
    return (
      <div data-testid="dnd-context" data-on-drag-end={!!onDragEnd}>
        {children}
      </div>
    );
  },
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children, items }: any) => (
    <div data-testid="sortable-context" data-items={JSON.stringify(items)}>
      {children}
    </div>
  ),
  horizontalListSortingStrategy: {},
}));

describe('Timeline', () => {
  const mockStoryboardData: Storyboard = {
    id: 'storyboard-1',
    title: 'Test Storyboard',
    description: 'A test storyboard',
    totalDuration: 20,
    shots: [
      {
        id: 'shot-1',
        number: 1,
        duration: 10,
        timing: { start: 0, end: 10 },
        description: 'Opening scene',
        runwayPrompt: 'Cinematic opening',
        cameraAngle: 'Wide Shot',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'shot-2',
        number: 2,
        duration: 10,
        timing: { start: 10, end: 20 },
        description: 'Closing scene',
        runwayPrompt: 'Cinematic closing',
        cameraAngle: 'Close-up',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.storyboard = null;
  });

  describe('Empty State', () => {
    it('should render empty state when no storyboard exists', () => {
      render(<Timeline />);

      expect(screen.getByText('No timeline to display')).toBeInTheDocument();
    });

    it('should apply correct styling to empty state container', () => {
      const { container } = render(<Timeline />);

      const emptyState = container.querySelector('.bg-gray-900.border-t.border-gray-800');
      expect(emptyState).toBeInTheDocument();
    });

    it('should center empty state content', () => {
      const { container } = render(<Timeline />);

      const centeredContent = container.querySelector('.flex.items-center.justify-center');
      expect(centeredContent).toBeInTheDocument();
    });

    it('should use full height for empty state', () => {
      const { container } = render(<Timeline />);

      const emptyState = container.querySelector('.h-full');
      expect(emptyState).toBeInTheDocument();
    });

    it('should style empty state text appropriately', () => {
      render(<Timeline />);

      const text = screen.getByText('No timeline to display');
      expect(text).toHaveClass('text-gray-500', 'text-sm');
    });
  });

  describe('Timeline with Storyboard', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should render timeline header with Clock icon', () => {
      render(<Timeline />);

      const clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toBeInTheDocument();
      expect(clockIcon).toHaveAttribute('data-size', '18');
    });

    it('should display "Timeline" heading', () => {
      render(<Timeline />);

      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('should display total duration', () => {
      render(<Timeline />);

      expect(screen.getByText('20s total')).toBeInTheDocument();
    });

    it('should render all timeline shots', () => {
      render(<Timeline />);

      expect(screen.getByTestId('timeline-shot-shot-1')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-shot-shot-2')).toBeInTheDocument();
    });

    it('should render shots in correct order', () => {
      render(<Timeline />);

      const shots = screen.getAllByText(/Shot \d+/);
      expect(shots).toHaveLength(2);
      expect(shots[0]).toHaveTextContent('Shot 1');
      expect(shots[1]).toHaveTextContent('Shot 2');
    });

    it('should apply correct container height', () => {
      const { container } = render(<Timeline />);

      const timelineContainer = container.querySelector('.h-48');
      expect(timelineContainer).toBeInTheDocument();
    });

    it('should apply correct background and border styling', () => {
      const { container } = render(<Timeline />);

      const timelineContainer = container.querySelector('.bg-gray-900.border-t.border-gray-800');
      expect(timelineContainer).toBeInTheDocument();
    });

    it('should apply padding to container', () => {
      const { container } = render(<Timeline />);

      const paddedContainer = container.querySelector('.p-4');
      expect(paddedContainer).toBeInTheDocument();
    });

    it('should have horizontal scrolling for shots', () => {
      const { container } = render(<Timeline />);

      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should apply gap between shots', () => {
      const { container } = render(<Timeline />);

      const shotsContainer = container.querySelector('.flex.gap-2');
      expect(shotsContainer).toBeInTheDocument();
    });

    it('should apply margin bottom to header', () => {
      const { container } = render(<Timeline />);

      const header = container.querySelector('.mb-3');
      expect(header).toBeInTheDocument();
    });
  });

  describe('DnD Integration', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should render DndContext', () => {
      render(<Timeline />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should pass onDragEnd handler to DndContext', () => {
      render(<Timeline />);

      const dndContext = screen.getByTestId('dnd-context');
      expect(dndContext).toHaveAttribute('data-on-drag-end', 'true');
    });

    it('should render SortableContext', () => {
      render(<Timeline />);

      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });

    it('should pass shot IDs to SortableContext', () => {
      render(<Timeline />);

      const sortableContext = screen.getByTestId('sortable-context');
      const items = JSON.parse(sortableContext.getAttribute('data-items') || '[]');
      expect(items).toEqual(['shot-1', 'shot-2']);
    });
  });

  describe('Drag and Drop Functionality', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
      mockUpdateTiming.mockImplementation((shots) => shots);
    });

    it('should reorder shots when dragging from first to second position', () => {
      render(<Timeline />);

      const dragEvent = {
        active: { id: 'shot-1' },
        over: { id: 'shot-2' },
      };

      mockOnDragEnd?.(dragEvent);

      expect(mockUpdateTiming).toHaveBeenCalled();
      expect(mockReorderShots).toHaveBeenCalled();

      const reorderedShots = mockReorderShots.mock.calls[0][0];
      expect(reorderedShots[0].id).toBe('shot-2');
      expect(reorderedShots[1].id).toBe('shot-1');
    });

    it('should reorder shots when dragging from second to first position', () => {
      render(<Timeline />);

      const dragEvent = {
        active: { id: 'shot-2' },
        over: { id: 'shot-1' },
      };

      mockOnDragEnd?.(dragEvent);

      expect(mockReorderShots).toHaveBeenCalled();

      const reorderedShots = mockReorderShots.mock.calls[0][0];
      expect(reorderedShots[0].id).toBe('shot-2');
      expect(reorderedShots[1].id).toBe('shot-1');
    });

    it('should not reorder when over is null', () => {
      render(<Timeline />);

      const dragEvent = {
        active: { id: 'shot-1' },
        over: null,
      };

      mockOnDragEnd?.(dragEvent);

      expect(mockReorderShots).not.toHaveBeenCalled();
      expect(mockUpdateTiming).not.toHaveBeenCalled();
    });

    it('should not reorder when active and over are the same', () => {
      render(<Timeline />);

      const dragEvent = {
        active: { id: 'shot-1' },
        over: { id: 'shot-1' },
      };

      mockOnDragEnd?.(dragEvent);

      expect(mockReorderShots).not.toHaveBeenCalled();
      expect(mockUpdateTiming).not.toHaveBeenCalled();
    });

    it('should call updateTiming with reordered shots', () => {
      render(<Timeline />);

      const dragEvent = {
        active: { id: 'shot-1' },
        over: { id: 'shot-2' },
      };

      mockOnDragEnd?.(dragEvent);

      expect(mockUpdateTiming).toHaveBeenCalledTimes(1);
      const updatedShots = mockUpdateTiming.mock.calls[0][0];
      expect(updatedShots).toHaveLength(2);
      expect(updatedShots[0].id).toBe('shot-2');
      expect(updatedShots[1].id).toBe('shot-1');
    });

    it('should pass updateTiming result to reorderShots', () => {
      const updatedShots = [
        { ...mockStoryboardData.shots[1], timing: { start: 0, end: 10 } },
        { ...mockStoryboardData.shots[0], timing: { start: 10, end: 20 } },
      ];

      mockUpdateTiming.mockReturnValue(updatedShots);

      render(<Timeline />);

      const dragEvent = {
        active: { id: 'shot-1' },
        over: { id: 'shot-2' },
      };

      mockOnDragEnd?.(dragEvent);

      expect(mockReorderShots).toHaveBeenCalledWith(updatedShots);
    });

    it('should handle dragging with multiple shots', () => {
      const threeShots = [
        ...mockStoryboardData.shots,
        {
          id: 'shot-3',
          number: 3,
          duration: 5,
          timing: { start: 20, end: 25 },
          description: 'Third scene',
          runwayPrompt: 'Third prompt',
          cameraAngle: 'Medium Shot',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockStoreState.storyboard = {
        ...mockStoryboardData,
        shots: threeShots,
        totalDuration: 25,
      };

      render(<Timeline />);

      // Drag first shot to third position
      const dragEvent = {
        active: { id: 'shot-1' },
        over: { id: 'shot-3' },
      };

      mockOnDragEnd?.(dragEvent);

      expect(mockReorderShots).toHaveBeenCalled();
      const reorderedShots = mockReorderShots.mock.calls[0][0];
      expect(reorderedShots[0].id).toBe('shot-2');
      expect(reorderedShots[1].id).toBe('shot-3');
      expect(reorderedShots[2].id).toBe('shot-1');
    });

    it('should preserve all shot properties when reordering', () => {
      render(<Timeline />);

      const dragEvent = {
        active: { id: 'shot-1' },
        over: { id: 'shot-2' },
      };

      mockOnDragEnd?.(dragEvent);

      const reorderedShots = mockUpdateTiming.mock.calls[0][0];
      expect(reorderedShots[0]).toMatchObject({
        id: 'shot-2',
        number: 2,
        description: 'Closing scene',
        runwayPrompt: 'Cinematic closing',
        cameraAngle: 'Close-up',
      });
      expect(reorderedShots[1]).toMatchObject({
        id: 'shot-1',
        number: 1,
        description: 'Opening scene',
        runwayPrompt: 'Cinematic opening',
        cameraAngle: 'Wide Shot',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shots array', () => {
      mockStoreState.storyboard = {
        ...mockStoryboardData,
        shots: [],
        totalDuration: 0,
      };

      render(<Timeline />);

      expect(screen.getByText('0s total')).toBeInTheDocument();
      expect(screen.queryByTestId(/timeline-shot-/)).not.toBeInTheDocument();
    });

    it('should handle single shot', () => {
      mockStoreState.storyboard = {
        ...mockStoryboardData,
        shots: [mockStoryboardData.shots[0]],
        totalDuration: 10,
      };

      render(<Timeline />);

      expect(screen.getByText('10s total')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-shot-shot-1')).toBeInTheDocument();
      expect(screen.queryByTestId('timeline-shot-shot-2')).not.toBeInTheDocument();
    });

    it('should handle many shots', () => {
      const manyShots = Array.from({ length: 10 }, (_, i) => ({
        id: `shot-${i + 1}`,
        number: i + 1,
        duration: 5,
        timing: { start: i * 5, end: (i + 1) * 5 },
        description: `Shot ${i + 1}`,
        runwayPrompt: `Prompt ${i + 1}`,
        cameraAngle: 'Wide Shot',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }));

      mockStoreState.storyboard = {
        ...mockStoryboardData,
        shots: manyShots,
        totalDuration: 50,
      };

      render(<Timeline />);

      expect(screen.getByText('50s total')).toBeInTheDocument();
      manyShots.forEach((shot) => {
        expect(screen.getByTestId(`timeline-shot-${shot.id}`)).toBeInTheDocument();
      });
    });

    it('should handle very long total duration', () => {
      mockStoreState.storyboard = {
        ...mockStoryboardData,
        totalDuration: 99999,
      };

      render(<Timeline />);

      expect(screen.getByText('99999s total')).toBeInTheDocument();
    });

    it('should handle zero duration', () => {
      mockStoreState.storyboard = {
        ...mockStoryboardData,
        totalDuration: 0,
      };

      render(<Timeline />);

      expect(screen.getByText('0s total')).toBeInTheDocument();
    });
  });

  describe('Header Styling', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should style clock icon with gray color', () => {
      render(<Timeline />);

      const clockIcon = screen.getByTestId('clock-icon');
      expect(clockIcon).toHaveClass('text-gray-400');
    });

    it('should apply font-medium to heading', () => {
      render(<Timeline />);

      const heading = screen.getByText('Timeline');
      expect(heading).toHaveClass('font-medium');
    });

    it('should style duration text with gray color', () => {
      render(<Timeline />);

      const durationText = screen.getByText('20s total');
      expect(durationText).toHaveClass('text-sm', 'text-gray-500');
    });

    it('should apply gap to header items', () => {
      const { container } = render(<Timeline />);

      const header = container.querySelector('.flex.items-center.gap-2');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Shots Container Styling', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should use flexbox for shots layout', () => {
      const { container } = render(<Timeline />);

      const shotsContainer = container.querySelector('.flex.gap-2.overflow-x-auto');
      expect(shotsContainer).toBeInTheDocument();
    });

    it('should apply bottom padding for scrollbar', () => {
      const { container } = render(<Timeline />);

      const shotsContainer = container.querySelector('.pb-2');
      expect(shotsContainer).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should render with correct DOM hierarchy', () => {
      const { container } = render(<Timeline />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('h-48', 'bg-gray-900', 'border-t', 'border-gray-800', 'p-4');

      const header = root.querySelector('.flex.items-center.gap-2.mb-3');
      expect(header).toBeInTheDocument();

      const dndContext = root.querySelector('[data-testid="dnd-context"]');
      expect(dndContext).toBeInTheDocument();
    });

    it('should render Timeline heading as h3', () => {
      render(<Timeline />);

      const heading = screen.getByText('Timeline');
      expect(heading.tagName.toLowerCase()).toBe('h3');
    });

    it('should wrap duration in span', () => {
      render(<Timeline />);

      const duration = screen.getByText('20s total');
      expect(duration.tagName.toLowerCase()).toBe('span');
    });
  });
});
