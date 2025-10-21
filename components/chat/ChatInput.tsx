'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-900">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <textarea
            id="chat-input"
            name="message"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your video idea..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-gray-800 text-gray-100 rounded-sm px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-700 disabled:opacity-50 max-h-32"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="bg-gray-800 hover:bg-gray-600 disabled:cursor-not-allowed text-white rounded-sm px-4 py-3 transition-colors self-end"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </form>
  );
}