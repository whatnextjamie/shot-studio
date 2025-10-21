'use client';

import { useEffect } from 'react';
import { useStoryboardStore } from '@/store/storyboard-store';
import { parseStoryboardFromMessage } from '@/lib/storyboard/parser';
import ShotCard from './ShotCard';
import { Film, Download, Sparkles } from 'lucide-react';

export default function CanvasPanel() {
  const messages = useStoryboardStore((state) => state.messages);
  const storyboard = useStoryboardStore((state) => state.storyboard);
  const setStoryboard = useStoryboardStore((state) => state.setStoryboard);
  const selectedShotId = useStoryboardStore((state) => state.selectedShotId);
  const setSelectedShotId = useStoryboardStore((state) => state.setSelectedShotId);

  // Parse storyboard from latest assistant message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.role === 'assistant') {
      const parsed = parseStoryboardFromMessage(lastMessage.content);

      if (parsed) {
        setStoryboard(parsed);
      }
    }
  }, [messages, setStoryboard]);

  if (!storyboard) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 text-gray-500">
        <div className="text-center max-w-md p-8">
          <Film size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">No Storyboard Yet</h3>
          <p className="text-sm">
            Start a conversation in the chat to create your storyboard.
            Describe your video idea and I'll generate a professional shot list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-900">
        <div>
          <h2 className="text-xl font-semibold">{storyboard.title}</h2>
          <p className="text-sm text-gray-400">
            {storyboard.shots.length} shots • {storyboard.totalDuration}s total
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
            <Sparkles size={18} />
            <span>Generate All</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Canvas Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storyboard.shots.map((shot) => (
            <ShotCard
              key={shot.id}
              shot={shot}
              isSelected={selectedShotId === shot.id}
              onClick={() => setSelectedShotId(shot.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}