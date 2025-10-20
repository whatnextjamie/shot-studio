import { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import type { Message } from '@/types/storyboard';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

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
          {message.content}
        </div>
      </div>
    </motion.div>
  );
});