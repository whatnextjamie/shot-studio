import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Shot, Storyboard, Message } from '@/types/storyboard';

interface StoryboardStore {
  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  // Storyboard
  storyboard: Storyboard | null;
  setStoryboard: (storyboard: Storyboard) => void;
  updateShot: (shotId: string, updates: Partial<Shot>) => void;
  reorderShots: (newOrder: Shot[]) => void;
  addShot: (shot: Shot) => void;
  removeShot: (shotId: string) => void;

  // UI State
  selectedShotId: string | null;
  setSelectedShotId: (id: string | null) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

export const useStoryboardStore = create<StoryboardStore>()(
  devtools((set) => ({
  // Messages
  messages: [],
  addMessage: (message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id,
          timestamp: new Date(),
        },
      ],
    }));
    return id;
  },
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  clearMessages: () => set({ messages: [] }),

  // Storyboard
  storyboard: null,
  setStoryboard: (storyboard) => set({ storyboard }),
  updateShot: (shotId, updates) =>
    set((state) => ({
      storyboard: state.storyboard
        ? {
            ...state.storyboard,
            shots: state.storyboard.shots.map((shot) =>
              shot.id === shotId ? { ...shot, ...updates } : shot
            ),
          }
        : null,
    })),
  reorderShots: (newOrder) =>
    set((state) => ({
      storyboard: state.storyboard
        ? {
            ...state.storyboard,
            shots: newOrder.map((shot, index) => ({
              ...shot,
              number: index + 1,
            })),
          }
        : null,
    })),
  addShot: (shot) =>
    set((state) => ({
      storyboard: state.storyboard
        ? {
            ...state.storyboard,
            shots: [...state.storyboard.shots, shot],
          }
        : null,
    })),
  removeShot: (shotId) =>
    set((state) => ({
      storyboard: state.storyboard
        ? {
            ...state.storyboard,
            shots: state.storyboard.shots.filter((shot) => shot.id !== shotId),
          }
        : null,
    })),

  // UI State
  selectedShotId: null,
  setSelectedShotId: (id) => set({ selectedShotId: id }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}), { name: 'StoryboardStore' }));