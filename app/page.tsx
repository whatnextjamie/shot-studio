'use client';

import { useState, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import ChatPanel from '@/components/chat/ChatPanel';
import CanvasPanel from '@/components/canvas/CanvasPanel';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const chatPanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleChat = () => {
    const panel = chatPanelRef.current;
    if (panel) {
      if (isChatCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  return (
    <main className="h-screen w-screen">
      <PanelGroup direction={isMobile ? 'vertical' : 'horizontal'}>
        {/* Chat Panel */}
        <Panel
          ref={chatPanelRef}
          defaultSize={isMobile ? 50 : 40}
          minSize={15}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setIsChatCollapsed(true)}
          onExpand={() => setIsChatCollapsed(false)}
        >
          <ChatPanel />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle
          className={
            isMobile
              ? 'h-2 bg-gray-800 hover:bg-blue-500 transition-colors'
              : 'w-2 bg-gray-800 hover:bg-blue-500 transition-colors'
          }
        />

        {/* Canvas Panel */}
        <Panel defaultSize={isMobile ? 50 : 60} minSize={30}>
          <div className="relative h-full">
            <CanvasPanel />
            {/* Toggle Chat Button */}
            <button
              onClick={toggleChat}
              className="absolute top-4 left-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-colors"
              aria-label={isChatCollapsed ? 'Open chat' : 'Close chat'}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isChatCollapsed ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </button>
          </div>
        </Panel>
      </PanelGroup>
    </main>
  );
}