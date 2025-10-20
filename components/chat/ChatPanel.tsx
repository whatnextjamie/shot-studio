'use client';

import { useStoryboardStore } from '@/store/storyboard-store';
import { useState } from 'react';

export default function ChatPanel() {
  const messages = useStoryboardStore((state) => state.messages);
  const addMessage = useStoryboardStore((state) => state.addMessage);
  const clearMessages = useStoryboardStore((state) => state.clearMessages);
  const isGenerating = useStoryboardStore((state) => state.isGenerating);
  const setIsGenerating = useStoryboardStore((state) => state.setIsGenerating);

  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    addMessage({
      role: 'user',
      content: input.trim(),
    });

    // Simulate assistant response
    setIsGenerating(true);
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: 'Store is working! Your message was received.',
      });
      setIsGenerating(false);
    }, 1000);

    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold">Chat</h2>
        <button
          onClick={clearMessages}
          className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Send a message to test the Zustand store</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-400">Typing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Test the store..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Messages: {messages.length} (stored in Zustand)
        </p>
      </form>
    </div>
  );
}
