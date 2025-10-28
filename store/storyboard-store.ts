import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Shot, Storyboard, Message } from '@/types/storyboard';

/**
 * Zustand store for managing storyboard state and UI interactions
 * Includes chat messages, storyboard data, and UI state
 */
interface StoryboardStore {
  // Messages
  /** Array of chat messages */
  messages: Message[];
  /**
   * Adds a new message to the chat
   * @param message - Message to add (id and timestamp will be generated)
   * @returns Generated message ID
   */
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  /**
   * Updates an existing message
   * @param id - Message ID to update
   * @param updates - Partial updates to apply
   */
  updateMessage: (id: string, updates: Partial<Message>) => void;
  /** Clears all messages from chat history */
  clearMessages: () => void;

  // Storyboard
  /** Current storyboard or null if none loaded */
  storyboard: Storyboard | null;
  /**
   * Sets the current storyboard
   * @param storyboard - Storyboard to set
   */
  setStoryboard: (storyboard: Storyboard) => void;
  /**
   * Updates a specific shot in the storyboard
   * @param shotId - ID of the shot to update
   * @param updates - Partial updates to apply to the shot
   */
  updateShot: (shotId: string, updates: Partial<Shot>) => void;
  /**
   * Reorders shots in the storyboard
   * @param newOrder - New array of shots in desired order
   */
  reorderShots: (newOrder: Shot[]) => void;
  /**
   * Adds a new shot to the storyboard
   * @param shot - Shot to add
   */
  addShot: (shot: Shot) => void;
  /**
   * Removes a shot from the storyboard
   * @param shotId - ID of the shot to remove
   */
  removeShot: (shotId: string) => void;

  // UI State
  /** ID of the currently selected shot, or null if none selected */
  selectedShotId: string | null;
  /**
   * Sets the selected shot ID
   * @param id - Shot ID to select, or null to deselect
   */
  setSelectedShotId: (id: string | null) => void;
  /** Whether a video is currently being generated */
  isGenerating: boolean;
  /**
   * Sets the generation state
   * @param isGenerating - Whether generation is in progress
   */
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