import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface VideoPreviewModalProps {
  videoUrl: string;
  shotNumber: number;
  onClose: () => void;
}

export default function VideoPreviewModal({ videoUrl, shotNumber, onClose }: VideoPreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Shot {shotNumber} - Video Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex gap-2">
          <a
            href={videoUrl}
            download={`shot-${shotNumber}.mp4`}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium text-center transition-colors"
          >
            Download Video
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}