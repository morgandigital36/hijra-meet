import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // UI state
  sidebarTab: 'chat', // 'chat' | 'qna' | 'polls' | 'people'
  sidebarOpen: true,
  notifications: [],

  // Actions
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      id: Date.now(),
      timestamp: new Date(),
      ...notification,
    }],
  })),

  removeNotification: (notificationId) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== notificationId),
  })),

  clearNotifications: () => set({ notifications: [] }),
}));
