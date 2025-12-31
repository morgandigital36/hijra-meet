import { create } from 'zustand';

export const useEventStore = create((set) => ({
  // Event state
  eventId: null,
  eventName: '',
  isLive: false,
  startTime: null,
  maxCameras: 20,
  activeCameraCount: 0,
  isRecording: false,

  // Actions
  setEvent: (event) => set({
    eventId: event.id,
    eventName: event.name,
    maxCameras: event.maxCameras || 20,
  }),

  updateLiveStatus: (isLive) => set({ isLive }),

  setStartTime: (time) => set({ startTime: time }),

  incrementActiveCameras: () => set((state) => ({
    activeCameraCount: Math.min(state.activeCameraCount + 1, state.maxCameras),
  })),

  decrementActiveCameras: () => set((state) => ({
    activeCameraCount: Math.max(state.activeCameraCount - 1, 0),
  })),

  setActiveCameraCount: (count) => set({ activeCameraCount: count }),

  setRecording: (isRecording) => set({ isRecording }),

  resetEvent: () => set({
    eventId: null,
    eventName: '',
    isLive: false,
    startTime: null,
    maxCameras: 20,
    activeCameraCount: 0,
    isRecording: false,
  }),
}));
