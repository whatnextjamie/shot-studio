import { motion } from 'framer-motion';
import { Camera, Clock, Film } from 'lucide-react';
import type { Shot } from '@/types/storyboard';

interface ShotCardProps {
  shot: Shot;
  isSelected: boolean;
  onClick: () => void;
}

export default function ShotCard({ shot, isSelected, onClick }: ShotCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        bg-gray-800 rounded-xl p-4 cursor-pointer transition-all border-2
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700 hover:border-gray-600'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
            {shot.number}
          </div>
          <span className="text-sm text-gray-400">Shot {shot.number}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={14} />
          <span>{shot.duration}s</span>
        </div>
      </div>

      {/* Thumbnail Placeholder */}
      <div className="w-full aspect-video bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
        {shot.videoUrl ? (
          <img
            src={shot.thumbnailUrl || shot.videoUrl}
            alt={`Shot ${shot.number}`}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Film size={32} className="text-gray-600" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-3 line-clamp-2">
        {shot.description}
      </p>

      {/* Camera Angle */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Camera size={14} />
        <span>{shot.cameraAngle}</span>
      </div>

      {/* Runway Status */}
      {shot.runwayStatus && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                shot.runwayStatus === 'SUCCEEDED'
                  ? 'bg-green-500'
                  : shot.runwayStatus === 'FAILED'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-xs text-gray-400 capitalize">
              {shot.runwayStatus}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}