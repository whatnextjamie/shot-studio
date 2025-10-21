import { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import type { Message } from '@/types/storyboard';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Remove JSON code blocks from assistant messages
  // Handle both complete blocks (with closing ```) and incomplete blocks (during streaming)
  const displayContent = message.role === 'assistant'
    ? message.content
        .replace(/```json[\s\S]*?```/g, '')  // Remove complete JSON blocks
        .replace(/```json[\s\S]*$/g, '')      // Remove incomplete JSON blocks (streaming)
    : message.content;

  // Check if message has storyboard JSON
  const hasStoryboard = message.role === 'assistant' && /```json[\s\S]*?"shots"[\s\S]*?```/.test(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 p-4 ${isUser ? 'bg-gray-900' : 'bg-gray-800/50'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-blue-500' : 'bg-purple-500'
        }`}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-400 mb-1">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-gray-100 whitespace-pre-wrap break-words">
          {displayContent}
          {hasStoryboard && (
            <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
              <span>✓</span>
              <span>Storyboard generated on canvas</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});