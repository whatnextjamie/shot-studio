import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storyboard, Message } from '@/types/storyboard';
import CanvasPanel from './CanvasPanel';

// Create mocks using vi.hoisted to avoid hoisting issues
const { mockParseStoryboardFromMessage, mockStoreState, mockSetStoryboard, mockSetSelectedShotId } = vi.hoisted(() => ({
  mockParseStoryboardFromMessage: vi.fn(),
  mockSetStoryboard: vi.fn(),
  mockSetSelectedShotId: vi.fn(),
  mockStoreState: {
    messages: [] as Message[],
    storyboard: null as Storyboard | null,
    selectedShotId: null as string | null,
  },
}));

// Mock the parser
vi.mock('@/lib/storyboard/parser', () => ({
  parseStoryboardFromMessage: mockParseStoryboardFromMessage,
}));

// Mock the store
vi.mock('@/store/storyboard-store', () => ({
  useStoryboardStore: (selector: any) => {
    const state = {
      messages: mockStoreState.messages,
      storyboard: mockStoreState.storyboard,
      setStoryboard: mockSetStoryboard,
      selectedShotId: mockStoreState.selectedShotId,
      setSelectedShotId: mockSetSelectedShotId,
    };
    return selector(state);
  },
}));

// Mock ShotCard component
vi.mock('./ShotCard', () => ({
  default: ({ shot, isSelected, onClick }: any) => (
    <div
      data-testid={`shot-card-${shot.id}`}
      data-selected={isSelected}
      onClick={onClick}
    >
      Shot {shot.number}: {shot.description}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Film: ({ size, className }: any) => <div data-testid="film-icon" data-size={size} className={className} />,
  Download: ({ size }: any) => <div data-testid="download-icon" data-size={size} />,
  Sparkles: ({ size }: any) => <div data-testid="sparkles-icon" data-size={size} />,
}));

describe('CanvasPanel', () => {
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
    // Reset mock state
    mockStoreState.messages = [];
    mockStoreState.storyboard = null;
    mockStoreState.selectedShotId = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should render empty state when no storyboard exists', () => {
      render(<CanvasPanel />);

      expect(screen.getByTestId('film-icon')).toBeInTheDocument();
      expect(screen.getByText('No Storyboard Yet')).toBeInTheDocument();
      expect(screen.getByText(/Start a conversation in the chat/)).toBeInTheDocument();
    });

    it('should display appropriate message in empty state', () => {
      render(<CanvasPanel />);

      expect(
        screen.getByText(/Describe your video idea and I'll generate a professional shot list/)
      ).toBeInTheDocument();
    });

    it('should center empty state content', () => {
      const { container } = render(<CanvasPanel />);

      const emptyState = container.querySelector('.flex.items-center.justify-center');
      expect(emptyState).toBeInTheDocument();
    });

    it('should style Film icon appropriately in empty state', () => {
      render(<CanvasPanel />);

      const icon = screen.getByTestId('film-icon');
      expect(icon).toHaveAttribute('data-size', '64');
      expect(icon).toHaveClass('opacity-50');
    });
  });

  describe('Storyboard Display', () => {
    beforeEach(() => {
      // Mock store to return storyboard
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should render storyboard header with title', () => {
      render(<CanvasPanel />);

      expect(screen.getByText('Test Storyboard')).toBeInTheDocument();
    });

    it('should display shot count and total duration', () => {
      render(<CanvasPanel />);

      expect(screen.getByText('2 shots • 20s total')).toBeInTheDocument();
    });

    it('should render Generate All button', () => {
      render(<CanvasPanel />);

      expect(screen.getByText('Generate All')).toBeInTheDocument();
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });

    it('should render Export button', () => {
      render(<CanvasPanel />);

      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    });

    it('should render all shot cards', () => {
      render(<CanvasPanel />);

      expect(screen.getByTestId('shot-card-shot-1')).toBeInTheDocument();
      expect(screen.getByTestId('shot-card-shot-2')).toBeInTheDocument();
    });

    it('should display shot descriptions in cards', () => {
      render(<CanvasPanel />);

      expect(screen.getByText(/Opening scene/)).toBeInTheDocument();
      expect(screen.getByText(/Closing scene/)).toBeInTheDocument();
    });

    it('should use grid layout for shots', () => {
      const { container } = render(<CanvasPanel />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Shot Selection', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should mark selected shot', () => {
      mockStoreState.selectedShotId = 'shot-1';
      render(<CanvasPanel />);

      const selectedCard = screen.getByTestId('shot-card-shot-1');
      expect(selectedCard).toHaveAttribute('data-selected', 'true');
    });

    it('should not mark unselected shots', () => {
      mockStoreState.selectedShotId = 'shot-1';
      render(<CanvasPanel />);

      const unselectedCard = screen.getByTestId('shot-card-shot-2');
      expect(unselectedCard).toHaveAttribute('data-selected', 'false');
    });

    it('should call setSelectedShotId when shot is clicked', async () => {
      const user = userEvent.setup();
      render(<CanvasPanel />);

      const shotCard = screen.getByTestId('shot-card-shot-1');
      await user.click(shotCard);

      expect(mockSetSelectedShotId).toHaveBeenCalledWith('shot-1');
    });

    it('should handle clicking different shots', async () => {
      const user = userEvent.setup();
      render(<CanvasPanel />);

      await user.click(screen.getByTestId('shot-card-shot-1'));
      expect(mockSetSelectedShotId).toHaveBeenCalledWith('shot-1');

      await user.click(screen.getByTestId('shot-card-shot-2'));
      expect(mockSetSelectedShotId).toHaveBeenCalledWith('shot-2');
    });
  });

  describe('Message Parsing', () => {
    it('should parse storyboard from assistant message', async () => {
      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: '```json\n{"title": "Test", "shots": []}\n```',
        timestamp: new Date(),
      };

      mockStoreState.messages.push(assistantMessage);
      mockParseStoryboardFromMessage.mockReturnValue(mockStoryboardData);

      render(<CanvasPanel />);

      await waitFor(() => {
        expect(mockParseStoryboardFromMessage).toHaveBeenCalledWith(assistantMessage.content);
        expect(mockSetStoryboard).toHaveBeenCalledWith(mockStoryboardData);
      });
    });

    it('should not parse if last message is from user', () => {
      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Create a storyboard',
        timestamp: new Date(),
      };

      mockStoreState.messages.push(userMessage);

      render(<CanvasPanel />);

      expect(mockParseStoryboardFromMessage).not.toHaveBeenCalled();
    });

    it('should not set storyboard if parsing returns null', async () => {
      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Invalid content',
        timestamp: new Date(),
      };

      mockStoreState.messages.push(assistantMessage);
      mockParseStoryboardFromMessage.mockReturnValue(null);

      render(<CanvasPanel />);

      await waitFor(() => {
        expect(mockParseStoryboardFromMessage).toHaveBeenCalled();
      });

      expect(mockSetStoryboard).not.toHaveBeenCalled();
    });

    it('should parse only the last assistant message', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Create storyboard',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Old storyboard',
          timestamp: new Date(),
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'Update it',
          timestamp: new Date(),
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: 'New storyboard',
          timestamp: new Date(),
        },
      ];

      mockStoreState.messages.push(...messages);
      mockParseStoryboardFromMessage.mockReturnValue(mockStoryboardData);

      render(<CanvasPanel />);

      await waitFor(() => {
        expect(mockParseStoryboardFromMessage).toHaveBeenCalledWith('New storyboard');
        expect(mockParseStoryboardFromMessage).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle multiple messages in sequence', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'First storyboard',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Updated storyboard',
          timestamp: new Date(),
        },
      ];

      mockStoreState.messages = messages;
      mockParseStoryboardFromMessage.mockReturnValue(mockStoryboardData);

      render(<CanvasPanel />);

      await waitFor(() => {
        // Should parse the last message
        expect(mockParseStoryboardFromMessage).toHaveBeenCalledWith('Updated storyboard');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shots array', () => {
      const emptyStoryboard = {
        ...mockStoryboardData,
        shots: [],
        totalDuration: 0,
      };

      mockStoreState.storyboard = emptyStoryboard;

      render(<CanvasPanel />);

      expect(screen.getByText('0 shots • 0s total')).toBeInTheDocument();
      expect(screen.queryByTestId('shot-card-shot-1')).not.toBeInTheDocument();
    });

    it('should handle single shot', () => {
      const singleShotStoryboard = {
        ...mockStoryboardData,
        shots: [mockStoryboardData.shots[0]],
        totalDuration: 10,
      };

      mockStoreState.storyboard = singleShotStoryboard;

      render(<CanvasPanel />);

      expect(screen.getByText('1 shots • 10s total')).toBeInTheDocument();
      expect(screen.getByTestId('shot-card-shot-1')).toBeInTheDocument();
    });

    it('should handle very long storyboard title', () => {
      const longTitleStoryboard = {
        ...mockStoryboardData,
        title: 'A'.repeat(100),
      };

      mockStoreState.storyboard = longTitleStoryboard;

      render(<CanvasPanel />);

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle no selected shot', () => {
      mockStoreState.storyboard = mockStoryboardData;
      mockStoreState.selectedShotId = null;

      render(<CanvasPanel />);

      const shot1 = screen.getByTestId('shot-card-shot-1');
      const shot2 = screen.getByTestId('shot-card-shot-2');

      expect(shot1).toHaveAttribute('data-selected', 'false');
      expect(shot2).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      mockStoreState.storyboard = mockStoryboardData;
    });

    it('should apply correct background color', () => {
      const { container } = render(<CanvasPanel />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('bg-gray-950');
    });

    it('should make canvas scrollable', () => {
      const { container } = render(<CanvasPanel />);

      const scrollContainer = container.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should apply proper button styling', () => {
      render(<CanvasPanel />);

      const generateButton = screen.getByText('Generate All').closest('button');
      expect(generateButton).toHaveClass('bg-purple-500', 'hover:bg-purple-600');

      const exportButton = screen.getByText('Export').closest('button');
      expect(exportButton).toHaveClass('bg-gray-800', 'hover:bg-gray-700');
    });

    it('should apply gap spacing to shot grid', () => {
      const { container } = render(<CanvasPanel />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });
  });
});
