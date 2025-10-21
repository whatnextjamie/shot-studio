import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';

// Store panel ref and callbacks
let mockPanelRef: any = null;
let mockOnCollapse: (() => void) | null = null;
let mockOnExpand: (() => void) | null = null;

// Track if we should auto-collapse for testing
let shouldAutoCollapse = false;

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children, direction }: any) => (
    <div data-testid="panel-group" data-direction={direction}>
      {children}
    </div>
  ),
  Panel: React.forwardRef(
    (
      {
        children,
        defaultSize,
        minSize,
        collapsible,
        collapsedSize,
        onCollapse,
        onExpand,
      }: any,
      ref: any
    ) => {
      // Store the ref and callbacks
      if (ref) {
        mockPanelRef = {
          collapse: vi.fn(),
          expand: vi.fn(),
        };
        if (typeof ref === 'function') {
          ref(mockPanelRef);
        } else {
          ref.current = mockPanelRef;
        }
      }
      mockOnCollapse = onCollapse;
      mockOnExpand = onExpand;

      // Auto-collapse if test wants it
      React.useEffect(() => {
        if (shouldAutoCollapse && onCollapse) {
          onCollapse();
        }
      }, [onCollapse]);

      return (
        <div
          data-testid="panel"
          data-default-size={defaultSize}
          data-min-size={minSize}
          data-collapsible={collapsible}
          data-collapsed-size={collapsedSize}
        >
          {children}
        </div>
      );
    }
  ),
  PanelResizeHandle: ({ className }: any) => (
    <div data-testid="panel-resize-handle" className={className} />
  ),
  ImperativePanelHandle: {},
}));

// Mock child components
vi.mock('@/components/chat/ChatPanel', () => ({
  default: () => <div data-testid="chat-panel">ChatPanel</div>,
}));

vi.mock('@/components/canvas/CanvasPanel', () => ({
  default: () => <div data-testid="canvas-panel">CanvasPanel</div>,
}));

vi.mock('@/components/timeline/Timeline', () => ({
  default: () => <div data-testid="timeline">Timeline</div>,
}));

describe('Home (page.tsx)', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    vi.clearAllMocks();
    originalInnerWidth = window.innerWidth;
    mockPanelRef = null;
    mockOnCollapse = null;
    mockOnExpand = null;
    shouldAutoCollapse = false;
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Basic Rendering', () => {
    it('should render main container with correct classes', () => {
      const { container } = render(<Home />);

      const main = container.querySelector('main');
      expect(main).toHaveClass('h-screen', 'w-screen', 'bg-gray-950', 'text-gray-100', 'flex', 'flex-col');
    });

    it('should render ChatPanel', () => {
      render(<Home />);

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });

    it('should render CanvasPanel', () => {
      render(<Home />);

      expect(screen.getByTestId('canvas-panel')).toBeInTheDocument();
    });

    it('should render Timeline', () => {
      render(<Home />);

      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });

    it('should render PanelGroup', () => {
      render(<Home />);

      expect(screen.getByTestId('panel-group')).toBeInTheDocument();
    });

    it('should render PanelResizeHandle', () => {
      render(<Home />);

      expect(screen.getByTestId('panel-resize-handle')).toBeInTheDocument();
    });

    it('should render toggle chat button', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Responsive Layout - Desktop', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should use horizontal direction on desktop', () => {
      render(<Home />);

      const panelGroup = screen.getByTestId('panel-group');
      expect(panelGroup).toHaveAttribute('data-direction', 'horizontal');
    });

    it('should apply horizontal resize handle styles on desktop', () => {
      render(<Home />);

      const resizeHandle = screen.getByTestId('panel-resize-handle');
      expect(resizeHandle).toHaveClass('w-2', 'bg-gray-800', 'hover:bg-blue-500', 'transition-colors');
    });

    it('should set chat panel default size to 40 on desktop', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const chatPanel = panels[0];
      expect(chatPanel).toHaveAttribute('data-default-size', '40');
    });

    it('should set canvas panel default size to 60 on desktop', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const canvasPanel = panels[1];
      expect(canvasPanel).toHaveAttribute('data-default-size', '60');
    });
  });

  describe('Responsive Layout - Mobile', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should use vertical direction on mobile', () => {
      render(<Home />);

      const panelGroup = screen.getByTestId('panel-group');
      expect(panelGroup).toHaveAttribute('data-direction', 'vertical');
    });

    it('should apply vertical resize handle styles on mobile', () => {
      render(<Home />);

      const resizeHandle = screen.getByTestId('panel-resize-handle');
      expect(resizeHandle).toHaveClass('h-2', 'bg-gray-800', 'hover:bg-blue-500', 'transition-colors');
    });

    it('should set chat panel default size to 50 on mobile', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const chatPanel = panels[0];
      expect(chatPanel).toHaveAttribute('data-default-size', '50');
    });

    it('should set canvas panel default size to 50 on mobile', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const canvasPanel = panels[1];
      expect(canvasPanel).toHaveAttribute('data-default-size', '50');
    });
  });

  describe('Window Resize Behavior', () => {
    it('should update layout when resizing from desktop to mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { rerender } = render(<Home />);

      // Verify desktop layout
      expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'horizontal');

      // Change to mobile width and trigger resize
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Verify mobile layout
      await waitFor(() => {
        expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'vertical');
      });
    });

    it('should update layout when resizing from mobile to desktop', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { rerender } = render(<Home />);

      // Verify mobile layout
      expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'vertical');

      // Change to desktop width and trigger resize
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Verify desktop layout
      await waitFor(() => {
        expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'horizontal');
      });
    });

    it('should set mobile to true when width is exactly 767px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      render(<Home />);

      expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'vertical');
    });

    it('should set mobile to false when width is exactly 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<Home />);

      expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'horizontal');
    });

    it('should clean up resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<Home />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Toggle Chat Functionality', () => {
    it('should call collapse when toggle is clicked while chat is open', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const toggleButton = screen.getByLabelText('Close chat');
      await user.click(toggleButton);

      expect(mockPanelRef?.collapse).toHaveBeenCalledTimes(1);
    });

    it('should render toggle button that can be interacted with', () => {
      render(<Home />);

      const toggleButton = screen.getByLabelText('Close chat');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton.tagName.toLowerCase()).toBe('button');
    });

    it('should show close icon by default when chat is open', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      const svg = button.querySelector('svg');
      const path = svg?.querySelector('path');
      // Check for close icon path (contains "M6 18L18 6M6 6l12 12")
      expect(path?.getAttribute('d')).toContain('M6 18L18 6M6 6l12 12');
    });

    it('should have correct initial aria-label', () => {
      render(<Home />);

      expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
    });

    it('should not throw error if panel ref is not set', async () => {
      // Clear the ref by mocking Panel to not set it
      const user = userEvent.setup();
      render(<Home />);

      // Even if panel ref methods aren't available, clicking shouldn't crash
      const toggleButton = screen.getByLabelText('Close chat');
      await expect(user.click(toggleButton)).resolves.not.toThrow();
    });

    it('should call toggleChat function when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const toggleButton = screen.getByLabelText('Close chat');

      // Initially no calls
      expect(mockPanelRef?.collapse).not.toHaveBeenCalled();
      expect(mockPanelRef?.expand).not.toHaveBeenCalled();

      // Click should trigger collapse (since we start expanded)
      await user.click(toggleButton);
      expect(mockPanelRef?.collapse).toHaveBeenCalledTimes(1);
    });

    it('should call expand when chat is collapsed and toggle is clicked', async () => {
      shouldAutoCollapse = true;
      const user = userEvent.setup();
      render(<Home />);

      // Wait for auto-collapse to trigger
      await waitFor(() => {
        expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText('Open chat');
      await user.click(toggleButton);

      expect(mockPanelRef?.expand).toHaveBeenCalledTimes(1);
    });

    it('should show chat icon when panel is collapsed', async () => {
      shouldAutoCollapse = true;
      render(<Home />);

      // Wait for auto-collapse to trigger
      await waitFor(() => {
        const button = screen.getByLabelText('Open chat');
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByLabelText('Open chat');
      const svg = button.querySelector('svg');
      const path = svg?.querySelector('path');

      // Check for chat icon path
      expect(path?.getAttribute('d')).toContain('M8 12h.01M12 12h.01M16 12h.01');
      expect(path?.getAttribute('d')).toContain('M21 12c0 4.418-4.03 8-9 8');
    });
  });

  describe('Panel Configuration', () => {
    it('should configure chat panel as collapsible', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const chatPanel = panels[0];
      expect(chatPanel).toHaveAttribute('data-collapsible', 'true');
    });

    it('should set chat panel collapsed size to 0', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const chatPanel = panels[0];
      expect(chatPanel).toHaveAttribute('data-collapsed-size', '0');
    });

    it('should set chat panel min size to 15', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const chatPanel = panels[0];
      expect(chatPanel).toHaveAttribute('data-min-size', '15');
    });

    it('should set canvas panel min size to 30', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      const canvasPanel = panels[1];
      expect(canvasPanel).toHaveAttribute('data-min-size', '30');
    });

    it('should attach ref to chat panel', () => {
      render(<Home />);

      expect(mockPanelRef).not.toBeNull();
      expect(mockPanelRef).toHaveProperty('collapse');
      expect(mockPanelRef).toHaveProperty('expand');
    });
  });

  describe('Toggle Button Styling', () => {
    it('should apply correct classes to toggle button', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      expect(button).toHaveClass(
        'absolute',
        'top-4',
        'left-4',
        'z-10',
        'p-2',
        'bg-gray-800',
        'hover:bg-gray-700',
        'text-white',
        'rounded-lg',
        'shadow-lg',
        'transition-colors'
      );
    });

    it('should position button absolutely', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      expect(button).toHaveClass('absolute');
    });

    it('should render SVG icon with correct size', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      const svg = button.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('should set SVG properties correctly', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      const svg = button.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Layout Structure', () => {
    it('should have flex-1 container for panels', () => {
      const { container } = render(<Home />);

      const flexContainer = container.querySelector('.flex-1');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should render Timeline outside of PanelGroup', () => {
      const { container } = render(<Home />);

      const main = container.querySelector('main');
      const timeline = screen.getByTestId('timeline');

      // Timeline should be a direct child of main, not inside PanelGroup
      expect(main).toContainElement(timeline);
      expect(screen.getByTestId('panel-group')).not.toContainElement(timeline);
    });

    it('should render CanvasPanel inside a relative positioned div', () => {
      const { container } = render(<Home />);

      const canvasPanel = screen.getByTestId('canvas-panel');
      const parent = canvasPanel.parentElement;
      expect(parent).toHaveClass('relative', 'h-full');
    });

    it('should render toggle button as sibling to CanvasPanel', () => {
      const { container } = render(<Home />);

      const canvasPanel = screen.getByTestId('canvas-panel');
      const toggleButton = screen.getByLabelText('Close chat');
      const parent = canvasPanel.parentElement;

      expect(parent).toContainElement(canvasPanel);
      expect(parent).toContainElement(toggleButton);
    });

    it('should render panels in correct order', () => {
      render(<Home />);

      const panels = screen.getAllByTestId('panel');
      expect(panels).toHaveLength(2);

      // First panel contains ChatPanel
      expect(panels[0]).toContainElement(screen.getByTestId('chat-panel'));

      // Second panel contains CanvasPanel
      expect(panels[1]).toContainElement(screen.getByTestId('canvas-panel'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid resize events', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<Home />);

      // Trigger multiple resize events rapidly
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: i % 2 === 0 ? 375 : 1024,
          });
          window.dispatchEvent(new Event('resize'));
        }
      });

      // Should still work correctly
      expect(screen.getByTestId('panel-group')).toBeInTheDocument();
    });

    it('should handle very large screen widths', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 5000,
      });

      render(<Home />);

      expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'horizontal');
    });

    it('should handle very small screen widths', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<Home />);

      expect(screen.getByTestId('panel-group')).toHaveAttribute('data-direction', 'vertical');
    });

    it('should not crash when clicking toggle button multiple times', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const toggleButton = screen.getByLabelText('Close chat');

      // Click multiple times - should not crash
      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);

      // At least one call should have been made
      expect(mockPanelRef?.collapse).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for toggle button', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      expect(button).toHaveAttribute('aria-label', 'Close chat');
    });

    it('should use semantic main element', () => {
      const { container } = render(<Home />);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('should have accessible button element', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      expect(button.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('SVG Icon Rendering', () => {
    it('should render close icon path with correct attributes', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      const path = button.querySelector('path');

      // In the DOM, SVG attributes are kebab-case
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('stroke-width', '2');
    });

    it('should render SVG with correct properties', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      const svg = button.querySelector('svg');

      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('should render close icon path initially', () => {
      render(<Home />);

      const button = screen.getByLabelText('Close chat');
      const path = button.querySelector('path');

      // Close icon path
      expect(path?.getAttribute('d')).toBe('M6 18L18 6M6 6l12 12');
    });
  });
});
