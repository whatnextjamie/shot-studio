import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 p-4 bg-gray-800/50">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500">
        <span className="text-xs">AI</span>
      </div>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}