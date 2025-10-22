'use client';

import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useStoryboardStore } from '@/store/storyboard-store';
import { updateTiming } from '@/lib/storyboard/parser';
import TimelineShot from './TimelineShot';
import { Clock } from 'lucide-react';

export default function Timeline() {
  const storyboard = useStoryboardStore((state) => state.storyboard);
  const reorderShots = useStoryboardStore((state) => state.reorderShots);

  if (!storyboard) {
    return (
      <div className="h-full flex items-center justify-center border-t border-gray-800">
        <div className="text-gray-500 text-sm">No timeline to display</div>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = storyboard.shots.findIndex((s) => s.id === active.id);
    const newIndex = storyboard.shots.findIndex((s) => s.id === over.id);

    const newOrder = [...storyboard.shots];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);

    // Update timing after reorder
    const updated = updateTiming(newOrder);
    reorderShots(updated);
  };

  return (
    <div className="border-t border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={18} className="text-gray-400" />
        <h3 className="font-medium">Timeline</h3>
        <span className="text-sm text-gray-500">
          {storyboard.totalDuration}s total
        </span>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={storyboard.shots.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {storyboard.shots.map((shot) => (
              <TimelineShot key={shot.id} shot={shot} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}