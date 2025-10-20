'use client';

import { useRef, useEffect } from 'react';
import { useStoryboardStore } from '@/store/storyboard-store';
import { ChatMessage } from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { MessageSquare, Trash2 } from 'lucide-react';

export default function ChatPanel() {
  const messages = useStoryboardStore((state) => state.messages);
  const addMessage = useStoryboardStore((state) => state.addMessage);
  const updateMessage = useStoryboardStore((state) => state.updateMessage);
  const clearMessages = useStoryboardStore((state) => state.clearMessages);
  const isGenerating = useStoryboardStore((state) => state.isGenerating);
  const setIsGenerating = useStoryboardStore((state) => state.setIsGenerating);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage({ role: 'user', content });

    // Create empty assistant message for live streaming
    const assistantMessageId = addMessage({
      role: 'assistant',
      content: '',
    });

    // Set generating state
    setIsGenerating(true);

    try {
      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response with live updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              const content = line.slice(2);
              assistantMessage += content;
              // Update message in real-time
              updateMessage(assistantMessageId, { content: assistantMessage });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      updateMessage(assistantMessageId, {
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-blue-500" size={24} />
          <h2 className="text-xl">Storyboard Assistant</h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Clear chat"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-center p-8">
            <div>
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start Planning Your Video</h3>
              <p className="text-sm">
                Describe your video idea and I'll help you create a professional storyboard.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages
              .filter((message) => message.content !== '')
              .map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            {isGenerating && messages[messages.length - 1]?.content === '' && (
              <TypingIndicator />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isGenerating} />
    </div>
  );
}
