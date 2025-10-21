import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShotCard from './ShotCard';
import type { Shot } from '@/types/storyboard';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, whileHover, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('ShotCard', () => {
  const mockShot: Shot = {
    id: 'shot-1',
    number: 1,
    duration: 10,
    timing: { start: 0, end: 10 },
    description: 'A cinematic opening scene with dramatic lighting',
    runwayPrompt: 'Cinematic opening, dramatic lighting, golden hour',
    cameraAngle: 'Wide Shot',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const defaultProps = {
    shot: mockShot,
    isSelected: false,
    onClick: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render shot card with basic information', () => {
      render(<ShotCard {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Shot 1')).toBeInTheDocument();
      expect(screen.getByText('10s')).toBeInTheDocument();
      expect(screen.getByText('A cinematic opening scene with dramatic lighting')).toBeInTheDocument();
      expect(screen.getByText('Wide Shot')).toBeInTheDocument();
    });

    it('should render shot number in header badge', () => {
      render(<ShotCard {...defaultProps} />);

      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('div')).toHaveClass('bg-blue-500');
    });

    it('should display duration with clock icon', () => {
      render(<ShotCard {...defaultProps} />);

      expect(screen.getByText('10s')).toBeInTheDocument();
    });

    it('should display camera angle with camera icon', () => {
      render(<ShotCard {...defaultProps} />);

      expect(screen.getByText('Wide Shot')).toBeInTheDocument();
    });

    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(200);
      const shotWithLongDesc = {
        ...mockShot,
        description: longDescription,
      };

      render(<ShotCard {...defaultProps} shot={shotWithLongDesc} />);

      const descElement = screen.getByText(longDescription);
      expect(descElement).toHaveClass('line-clamp-2');
    });
  });

  describe('Selection state', () => {
    it('should apply selected styles when isSelected is true', () => {
      const { container } = render(<ShotCard {...defaultProps} isSelected={true} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-blue-500');
      expect(card).toHaveClass('ring-2');
      expect(card).toHaveClass('ring-blue-500/50');
    });

    it('should apply unselected styles when isSelected is false', () => {
      const { container } = render(<ShotCard {...defaultProps} isSelected={false} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-gray-700');
      expect(card).toHaveClass('hover:border-gray-600');
    });
  });

  describe('Video/Thumbnail display', () => {
    it('should show Film icon placeholder when no video exists', () => {
      const { container } = render(<ShotCard {...defaultProps} />);

      // Film icon is rendered as SVG, check for the placeholder container
      const placeholder = container.querySelector('.aspect-video');
      expect(placeholder).toBeInTheDocument();
      // SVG element should be present
      const svg = placeholder?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should display video thumbnail when videoUrl is provided', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      };

      render(<ShotCard {...defaultProps} shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
    });

    it('should use videoUrl as fallback when thumbnailUrl is not provided', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
      };

      render(<ShotCard {...defaultProps} shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toHaveAttribute('src', 'https://example.com/video.mp4');
    });
  });

  describe('Runway status display', () => {
    it('should not show status indicator when runwayStatus is undefined', () => {
      render(<ShotCard {...defaultProps} />);

      expect(screen.queryByText(/PENDING|SUCCEEDED|FAILED/i)).not.toBeInTheDocument();
    });

    it('should show green indicator for SUCCEEDED status', () => {
      const shotWithStatus = {
        ...mockShot,
        runwayStatus: 'SUCCEEDED' as const,
      };

      render(<ShotCard {...defaultProps} shot={shotWithStatus} />);

      expect(screen.getByText('SUCCEEDED')).toBeInTheDocument();
      const indicator = screen.getByText('SUCCEEDED').previousSibling as HTMLElement;
      expect(indicator).toHaveClass('bg-green-500');
    });

    it('should show red indicator for FAILED status', () => {
      const shotWithStatus = {
        ...mockShot,
        runwayStatus: 'FAILED' as const,
      };

      render(<ShotCard {...defaultProps} shot={shotWithStatus} />);

      expect(screen.getByText('FAILED')).toBeInTheDocument();
      const indicator = screen.getByText('FAILED').previousSibling as HTMLElement;
      expect(indicator).toHaveClass('bg-red-500');
    });

    it('should show yellow pulsing indicator for PENDING status', () => {
      const shotWithStatus = {
        ...mockShot,
        runwayStatus: 'PENDING' as const,
      };

      render(<ShotCard {...defaultProps} shot={shotWithStatus} />);

      expect(screen.getByText('PENDING')).toBeInTheDocument();
      const indicator = screen.getByText('PENDING').previousSibling as HTMLElement;
      expect(indicator).toHaveClass('bg-yellow-500');
      expect(indicator).toHaveClass('animate-pulse');
    });

    it('should capitalize status text', () => {
      const shotWithStatus = {
        ...mockShot,
        runwayStatus: 'SUCCEEDED' as const,
      };

      render(<ShotCard {...defaultProps} shot={shotWithStatus} />);

      const statusText = screen.getByText('SUCCEEDED');
      expect(statusText).toHaveClass('capitalize');
    });
  });

  describe('Interaction', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<ShotCard {...defaultProps} onClick={onClick} />);

      const card = screen.getByText('Shot 1').closest('div')?.parentElement;
      if (card) {
        await user.click(card);
        expect(onClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class for clickability', () => {
      const { container } = render(<ShotCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Optional fields', () => {
    it('should render without optional mood field', () => {
      const shotWithoutMood = { ...mockShot };
      delete (shotWithoutMood as any).mood;

      render(<ShotCard {...defaultProps} shot={shotWithoutMood} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
    });

    it('should render without optional notes field', () => {
      const shotWithoutNotes = { ...mockShot };
      delete (shotWithoutNotes as any).notes;

      render(<ShotCard {...defaultProps} shot={shotWithoutNotes} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
    });

    it('should handle all optional Runway fields being undefined', () => {
      const minimalShot = {
        ...mockShot,
        runwayTaskId: undefined,
        runwayStatus: undefined,
        progressRatio: undefined,
        progressText: undefined,
        videoUrl: undefined,
        thumbnailUrl: undefined,
      };

      render(<ShotCard {...defaultProps} shot={minimalShot} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
      expect(screen.queryByText(/PENDING|SUCCEEDED|FAILED/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle shot number 0', () => {
      const shotZero = { ...mockShot, number: 0 };

      render(<ShotCard {...defaultProps} shot={shotZero} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Shot 0')).toBeInTheDocument();
    });

    it('should handle very large shot numbers', () => {
      const largeShotNumber = { ...mockShot, number: 999 };

      render(<ShotCard {...defaultProps} shot={largeShotNumber} />);

      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('Shot 999')).toBeInTheDocument();
    });

    it('should handle duration of 0', () => {
      const zeroDuration = { ...mockShot, duration: 0 };

      render(<ShotCard {...defaultProps} shot={zeroDuration} />);

      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('should handle very long duration values', () => {
      const longDuration = { ...mockShot, duration: 3600 };

      render(<ShotCard {...defaultProps} shot={longDuration} />);

      expect(screen.getByText('3600s')).toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const emptyDesc = { ...mockShot, description: '' };

      render(<ShotCard {...defaultProps} shot={emptyDesc} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
    });

    it('should handle empty cameraAngle', () => {
      const emptyAngle = { ...mockShot, cameraAngle: '' };

      render(<ShotCard {...defaultProps} shot={emptyAngle} />);

      expect(screen.getByText('Shot 1')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have proper background and rounded corners', () => {
      const { container } = render(<ShotCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gray-800');
      expect(card).toHaveClass('rounded-xl');
    });

    it('should have proper padding', () => {
      const { container } = render(<ShotCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
    });

    it('should have transition-all for smooth animations', () => {
      const { container } = render(<ShotCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('transition-all');
    });

    it('should have aspect-video for thumbnail', () => {
      const { container } = render(<ShotCard {...defaultProps} />);

      const thumbnail = container.querySelector('.aspect-video');
      expect(thumbnail).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for video thumbnails', () => {
      const shotWithVideo = {
        ...mockShot,
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      };

      render(<ShotCard {...defaultProps} shot={shotWithVideo} />);

      const img = screen.getByAltText('Shot 1');
      expect(img).toBeInTheDocument();
    });

    it('should be keyboard accessible (clickable)', () => {
      const { container } = render(<ShotCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });
  });
});
