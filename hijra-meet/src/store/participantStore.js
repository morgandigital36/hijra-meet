import { create } from 'zustand';

export const useParticipantStore = create((set) => ({
  // Participants state
  participants: [],
  localParticipant: null,

  // Actions
  setLocalParticipant: (participant) => set({ localParticipant: participant }),

  addParticipant: (participant) => set((state) => {
    // Avoid duplicates
    if (state.participants.some(p => p.id === participant.id)) return state;
    return { participants: [...state.participants, participant] };
  }),

  syncParticipants: (participants) => set({ participants }),

  removeParticipant: (participantId) => set((state) => ({
    participants: state.participants.filter((p) => p.id !== participantId),
  })),

  updateParticipant: (participantId, updates) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, ...updates } : p
    ),
  })),

  setParticipantStream: (participantId, stream) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, stream } : p
    ),
  })),

  setParticipantSpeaking: (participantId, isSpeaking) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, isSpeaking } : p
    ),
  })),

  toggleParticipantCamera: (participantId) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, cameraOn: !p.cameraOn } : p
    ),
  })),

  toggleParticipantMic: (participantId) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, micOn: !p.micOn } : p
    ),
  })),

  setHandRaised: (participantId, handRaised) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, handRaised } : p
    ),
  })),

  resetParticipants: () => set({
    participants: [],
    localParticipant: null,
  }),
}));
