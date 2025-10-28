'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { ChatMessage } from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useStoryboardStore } from '@/store/storyboard-store';
import { parseStoryboardFromMessage } from '@/lib/storyboard/parser';

export default function ChatPanel() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setStoryboard = useStoryboardStore((state) => state.setStoryboard);

  const {
    messages,
    sendMessage,
    setMessages,
    error,
    status,
  } = useChat({
    onFinish: ({ message }) => {
      // Parse storyboard from assistant message if present
      if (message.role === 'assistant') {
        // Extract text content from parts array
        const content = message.parts
          .filter((part) => part.type === 'text')
          .map((part) => (part as any).text)
          .join('');

        // Parse the storyboard JSON from the content
        const storyboard = parseStoryboardFromMessage(content);

        if (storyboard) {
          setStoryboard(storyboard);
        }
      }
    },
    onError: (chatError) => {
      console.error('Chat error:', chatError);
    },
  });

  // Derive isLoading from status
  const isLoading = status === 'streaming';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage({ text: content });
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-gray-400" size={24} />
          <h2 className="text-xl">Storyboard Assistant</h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Clear chat"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center space-y-4">
              <MessageSquare size={48} className="mx-auto" />
              <div className="space-y-2">
                <p className="text-lg">Start a conversation</p>
                <p className="text-sm">
                  Describe your video project and I&apos;ll create a storyboard for you.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => {
              // Extract text content from parts array
              const content = message.parts
                .filter((part) => part.type === 'text')
                .map((part) => (part as any).text)
                .join('');

              return (
                <ChatMessage key={message.id} message={{
                  id: message.id,
                  role: message.role as 'user' | 'assistant',
                  content,
                  createdAt: undefined
                }} />
              );
            })}
            {isLoading && <TypingIndicator />}
            {error && (
              <div className="text-red-400 text-sm">
                Error: {error.message}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput 
        onSend={handleSendMessage} 
        disabled={isLoading} 
      />
    </div>
  );
}