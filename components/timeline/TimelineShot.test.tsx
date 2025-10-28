import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimelineShot from './TimelineShot';
import type { Shot } from '@/types/storyboard';

// Create mocks using vi.hoisted
const { mockUseSortable } = vi.hoisted(() => ({
  mockUseSortable: vi.fn(),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: mockUseSortable,
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => {
        if (!transform) return '';
        return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
      },
    },
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  GripVertical: ({ size }: any) => (
    <div data-testid="grip-vertical-icon" data-size={size} />
  ),
  Film: ({ size, className }: any) => (
    <div data-testid="film-icon" data-size={size} className={className} />
  ),
}));

describe('TimelineShot', () => {
  const mockShot: Shot = {
    id: 'shot-1',
    number: 1,
    duration: 10,
    timing: { start: 0, end: 10 },
    description: 'Opening scene',
    runwayPrompt: 'Cinematic opening',
    cameraAngle: 'Wide Shot',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const defaultSortableReturn = {
    attributes: { role: 'button', tabIndex: 0 },
    listeners: { onPointerDown: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSortable.mockReturnValue(defaultSortableReturn);
  });

  describe('Basic Rendering', () => {
    it('should render shot number', () => {
      render(<TimelineShot shot={mockShot} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
    });

    it('should render duration', () => {
      render(<TimelineShot shot={mockShot} />);

      expect(screen.getByText('10s')).toBeInTheDocument();
    });

    it('should render GripVertical icon', () => {
      render(<TimelineShot shot={mockShot} />);

      const gripIcon = screen.getByTestId('grip-vertical-icon');
      expect(gripIcon).toBeInTheDocument();
      expect(gripIcon).toHaveAttribute('data-size', '14');
    });

    it('should render Film icon placeholder when no video exists', () => {
      render(<TimelineShot shot={mockShot} />);

      const filmIcon = screen.getByTestId('film-icon');
      expect(filmIcon).toBeInTheDocument();
      expect(filmIcon).toHaveAttribute('data-size', '20');
    });

    it('should apply correct container width', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveClass('w-32');
    });

    it('should apply flex-shrink to allow flexible sizing', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveClass('flex-shrink');
    });

    it('should apply cursor-move class', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveClass('cursor-move');
    });
  });

  describe('Video/Thumbnail Display', () => {
    it('should show Film icon when no videoUrl', () => {
      render(<TimelineShot shot={mockShot} />);

      expect(screen.getByTestId('film-icon')).toBeInTheDocument();
      expect(screen.queryByAltText('Shot 1')).not.toBeInTheDocument();
    });

    it('should display thumbnail image when videoUrl exists', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      };

      render(<TimelineShot shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
    });

    it('should use videoUrl as fallback when thumbnailUrl is not provided', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
      };

      render(<TimelineShot shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    it('should apply object-cover to thumbnail image', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
      };

      render(<TimelineShot shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toHaveClass('object-cover');
    });

    it('should apply rounded corners to thumbnail', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
      };

      render(<TimelineShot shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toHaveClass('rounded');
    });

    it('should make thumbnail full width and height', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
      };

      render(<TimelineShot shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toHaveClass('w-full', 'h-full');
    });
  });

  describe('Dragging State', () => {
    it('should apply opacity-50 when dragging', () => {
      mockUseSortable.mockReturnValue({
        ...defaultSortableReturn,
        isDragging: true,
      });

      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveClass('opacity-50');
    });

    it('should apply ring-2 ring-blue-500 when dragging', () => {
      mockUseSortable.mockReturnValue({
        ...defaultSortableReturn,
        isDragging: true,
      });

      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveClass('ring-2', 'ring-gray-500');
    });

    it('should not apply dragging styles when not dragging', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).not.toHaveClass('opacity-50');
      expect(shotContainer).not.toHaveClass('ring-2');
    });

    it('should apply transform style when dragging', () => {
      mockUseSortable.mockReturnValue({
        ...defaultSortableReturn,
        transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      });

      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveStyle({ transform: 'translate3d(10px, 20px, 0)' });
    });

    it('should apply transition style', () => {
      mockUseSortable.mockReturnValue({
        ...defaultSortableReturn,
        transition: 'transform 200ms ease',
      });

      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveStyle({ transition: 'transform 200ms ease' });
    });

    it('should handle null transform', () => {
      mockUseSortable.mockReturnValue({
        ...defaultSortableReturn,
        transform: null,
      });

      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveStyle({ transform: '' });
    });
  });

  describe('Sortable Hook Integration', () => {
    it('should call useSortable with shot id', () => {
      render(<TimelineShot shot={mockShot} />);

      expect(mockUseSortable).toHaveBeenCalledWith({ id: 'shot-1' });
    });

    it('should apply attributes from useSortable', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveAttribute('role', 'button');
      expect(shotContainer).toHaveAttribute('tabIndex', '0');
    });

    it('should apply ref from useSortable', () => {
      const mockSetNodeRef = vi.fn();
      mockUseSortable.mockReturnValue({
        ...defaultSortableReturn,
        setNodeRef: mockSetNodeRef,
      });

      render(<TimelineShot shot={mockShot} />);

      expect(mockSetNodeRef).toHaveBeenCalled();
    });

    it('should handle different shot IDs', () => {
      const differentShot = { ...mockShot, id: 'shot-999' };

      render(<TimelineShot shot={differentShot} />);

      expect(mockUseSortable).toHaveBeenCalledWith({ id: 'shot-999' });
    });
  });

  describe('Shot Information Display', () => {
    it('should display correct shot number for different shots', () => {
      const shot5 = { ...mockShot, number: 5 };

      render(<TimelineShot shot={shot5} />);

      expect(screen.getByText('Shot 5')).toBeInTheDocument();
    });

    it('should display correct duration for different durations', () => {
      const longShot = { ...mockShot, duration: 30 };

      render(<TimelineShot shot={longShot} />);

      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('should handle shot number 0', () => {
      const shotZero = { ...mockShot, number: 0 };

      render(<TimelineShot shot={shotZero} />);

      expect(screen.getByText('Shot 0')).toBeInTheDocument();
    });

    it('should handle very large shot numbers', () => {
      const largeNumberShot = { ...mockShot, number: 999 };

      render(<TimelineShot shot={largeNumberShot} />);

      expect(screen.getByText('Shot 999')).toBeInTheDocument();
    });

    it('should handle duration of 0', () => {
      const zeroDuration = { ...mockShot, duration: 0 };

      render(<TimelineShot shot={zeroDuration} />);

      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('should handle very long durations', () => {
      const longDuration = { ...mockShot, duration: 3600 };

      render(<TimelineShot shot={longDuration} />);

      expect(screen.getByText('3600s')).toBeInTheDocument();
    });
  });

  describe('Container Styling', () => {
    it('should apply padding', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const shotContainer = container.firstChild as HTMLElement;
      expect(shotContainer).toHaveClass('p-2');
    });
  });

  describe('Drag Handle Styling', () => {
    it('should style drag handle with gray color', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const dragHandle = container.querySelector('.text-gray-400');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should apply gap to drag handle items', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const dragHandle = container.querySelector('.flex.items-center.gap-1');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should apply margin bottom to drag handle', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const dragHandle = container.querySelector('.mb-2');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should style shot number text as extra small and medium weight', () => {
      render(<TimelineShot shot={mockShot} />);

      const shotNumberText = screen.getByText('Shot 1');
      expect(shotNumberText).toHaveClass('text-xs', 'font-medium');
    });
  });

  describe('Thumbnail Container Styling', () => {
    it('should apply aspect-video to thumbnail container', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const thumbnailContainer = container.querySelector('.aspect-video');
      expect(thumbnailContainer).toBeInTheDocument();
    });

    it('should apply full width to thumbnail container', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const thumbnailContainer = container.querySelector('.w-full.aspect-video');
      expect(thumbnailContainer).toBeInTheDocument();
    });

    it('should apply bg-gray-700 to thumbnail placeholder', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const thumbnailContainer = container.querySelector('.bg-gray-700');
      expect(thumbnailContainer).toBeInTheDocument();
    });

    it('should apply rounded corners to thumbnail container', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const thumbnailContainer = container.querySelector('.aspect-video.rounded');
      expect(thumbnailContainer).toBeInTheDocument();
    });

    it('should center Film icon in placeholder', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const thumbnailContainer = container.querySelector('.flex.items-center.justify-center');
      expect(thumbnailContainer).toBeInTheDocument();
    });

    it('should apply margin bottom to thumbnail container', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const thumbnailContainer = container.querySelector('.aspect-video.mb-2');
      expect(thumbnailContainer).toBeInTheDocument();
    });
  });

  describe('Duration Display Styling', () => {
    it('should style duration text as extra small', () => {
      render(<TimelineShot shot={mockShot} />);

      const durationText = screen.getByText('10s');
      expect(durationText).toHaveClass('text-xs');
    });

    it('should style duration text with gray color', () => {
      render(<TimelineShot shot={mockShot} />);

      const durationText = screen.getByText('10s');
      expect(durationText).toHaveClass('text-gray-400');
    });

    it('should center duration text', () => {
      render(<TimelineShot shot={mockShot} />);

      const durationText = screen.getByText('10s');
      expect(durationText).toHaveClass('text-center');
    });
  });

  describe('Film Icon Styling', () => {
    it('should apply gray color to Film icon', () => {
      render(<TimelineShot shot={mockShot} />);

      const filmIcon = screen.getByTestId('film-icon');
      expect(filmIcon).toHaveClass('text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle shot without createdAt', () => {
      const shotWithoutCreatedAt = { ...mockShot };
      delete (shotWithoutCreatedAt as any).createdAt;

      render(<TimelineShot shot={shotWithoutCreatedAt} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
    });

    it('should handle shot without updatedAt', () => {
      const shotWithoutUpdatedAt = { ...mockShot };
      delete (shotWithoutUpdatedAt as any).updatedAt;

      render(<TimelineShot shot={shotWithoutUpdatedAt} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
    });

    it('should handle shot with all optional fields undefined', () => {
      const minimalShot = {
        ...mockShot,
        videoUrl: undefined,
        thumbnailUrl: undefined,
        runwayTaskId: undefined,
        runwayStatus: undefined,
        progressRatio: undefined,
        progressText: undefined,
      };

      render(<TimelineShot shot={minimalShot} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
      expect(screen.getByTestId('film-icon')).toBeInTheDocument();
    });

    it('should handle empty thumbnailUrl with videoUrl', () => {
      const shotWithEmptyThumbnail = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: undefined,
      };

      render(<TimelineShot shot={shotWithEmptyThumbnail} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toHaveAttribute('src', 'https://example.com/video.mp4');
    });
  });

  describe('Component Structure', () => {
    it('should render with correct DOM hierarchy', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const root = container.firstChild as HTMLElement;
      expect(root).toBeInTheDocument();

      const dragHandle = root.querySelector('.flex.items-center.gap-1.mb-2');
      expect(dragHandle).toBeInTheDocument();

      const thumbnail = root.querySelector('.aspect-video');
      expect(thumbnail).toBeInTheDocument();

      const duration = root.querySelector('.text-xs.text-gray-400.text-center');
      expect(duration).toBeInTheDocument();
    });

    it('should have three main sections: drag handle, thumbnail, duration', () => {
      const { container } = render(<TimelineShot shot={mockShot} />);

      const root = container.firstChild as HTMLElement;
      const children = Array.from(root.children);

      // First child is drag handle
      expect(children[0]).toHaveClass('flex', 'items-center');

      // Second child is thumbnail
      expect(children[1]).toHaveClass('aspect-video');

      // Third child is duration
      expect(children[2]).toHaveClass('text-center');
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for thumbnails', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
      };

      render(<TimelineShot shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toBeInTheDocument();
    });

    it('should include shot number in alt text', () => {
      const shot10 = {
        ...mockShot,
        number: 10,
        videoUrl: 'https://example.com/video.mp4',
      };

      render(<TimelineShot shot={shot10} />);

      expect(screen.getByAltText('Shot 10')).toBeInTheDocument();
    });
  });
});
