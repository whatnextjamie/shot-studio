import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Film } from 'lucide-react';
import type { Shot } from '@/types/storyboard';

interface TimelineShotProps {
  shot: Shot;
}

export default function TimelineShot({ shot }: TimelineShotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex-shrink w-32 bg-gray-900 rounded-sm p-2 cursor-move
        ${isDragging ? 'opacity-50 ring-2 ring-gray-500' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      {/* Drag Handle */}
      <div className="flex items-center gap-1 mb-2 text-gray-400">
        <GripVertical size={14} />
        <span className="text-xs font-medium">Shot {shot.number}</span>
      </div>

      {/* Thumbnail */}
      <div className="w-full aspect-video bg-gray-700 rounded flex items-center justify-center mb-2">
        {shot.videoUrl ? (
          <img
            src={shot.thumbnailUrl || shot.videoUrl}
            alt={`Shot ${shot.number}`}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <Film size={20} className="text-gray-600" />
        )}
      </div>

      {/* Duration */}
      <div className="text-xs text-gray-400 text-center">
        {shot.duration}s
      </div>
    </div>
  );
}