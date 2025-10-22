import { motion } from 'framer-motion';
import { Camera, Clock, Film, Play, Loader2, CheckCircle, XCircle, Video } from 'lucide-react';
import type { Shot } from '@/types/storyboard';
import { useRunwayGeneration } from '@/hooks/useRunwayGeneration';
import { useState } from 'react';
import VideoPreviewModal from './VideoPreviewModal';

interface ShotCardProps {
  shot: Shot;
  isSelected: boolean;
  onClick: () => void;
}

export default function ShotCard({ shot, isSelected, onClick }: ShotCardProps) {
  const { generate, isGenerating, progressRatio, error } = useRunwayGeneration(shot.id);
  const [showVideo, setShowVideo] = useState(false);

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    generate(shot.runwayPrompt);
  };

  const handleViewVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVideo(true);
  };

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
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {shot.runwayStatus === 'SUCCEEDED' && (
            <div className="bg-green-500 rounded-full p-1">
              <CheckCircle size={16} />
            </div>
          )}
          {(shot.runwayStatus === 'PENDING' || shot.runwayStatus === 'RUNNING' || shot.runwayStatus === 'THROTTLED') && (
            <div className="bg-yellow-500 rounded-full p-1">
              <Loader2 size={16} className="animate-spin" />
            </div>
          )}
          {(shot.runwayStatus === 'FAILED' || shot.runwayStatus === 'CANCELLED') && (
            <div className="bg-red-500 rounded-full p-1">
              <XCircle size={16} />
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={14} />
            <span>{shot.duration}s</span>
          </div>
        </div>
      </div>

      {/* Thumbnail Placeholder */}
      <div className="w-full aspect-video bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {shot.videoUrl ? (
          <video
            src={shot.videoUrl}
            className="w-full h-full object-cover rounded-lg"
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
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
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <Camera size={14} />
        <span>{shot.cameraAngle}</span>
      </div>

      {/* Mood */}
      {shot.mood && (
        <div className="text-sm text-gray-400 mb-3">
          <div className="font-medium text-gray-300">Mood:</div>
          {shot.mood}
        </div>
      )}

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-1 mb-3">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressRatio * 100}%` }}
              className="h-full bg-blue-500"
            />
          </div>
          <div className="text-xs text-gray-400 text-center">
            {Math.round(progressRatio * 100)}% complete
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded p-2 mb-3">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {!shot.videoUrl && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Play size={16} />
                Generate
              </>
            )}
          </button>
        )}

        {shot.videoUrl && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewVideo}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Video size={16} />
            View Video
          </motion.button>
        )}
      </div>

      {/* Video Preview Modal */}
      {showVideo && shot.videoUrl && (
        <VideoPreviewModal
          videoUrl={shot.videoUrl}
          shotNumber={shot.number}
          onClose={() => setShowVideo(false)}
        />
      )}
    </motion.div>
  );
}