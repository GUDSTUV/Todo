import { create } from 'zustand';

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Selected list
  selectedListId: string | null;
  setSelectedListId: (listId: string | null) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Task modal
  isTaskModalOpen: boolean;
  selectedTaskId: string | null;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;

  // List modal
  isListModalOpen: boolean;
  selectedListForEdit: string | null;
  openListModal: (listId?: string) => void;
  closeListModal: () => void;

  // Search & filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  priorityFilter: string | null;
  setPriorityFilter: (priority: string | null) => void;
  tagFilters: string[];
  setTagFilters: (tags: string[]) => void;
  clearFilters: () => void;

  // View mode
  viewMode: 'list' | 'grid' | 'kanban';
  setViewMode: (mode: 'list' | 'grid' | 'kanban') => void;

  // Sort
  sortBy: 'order' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  setSortBy: (sortBy: 'order' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  // Selected list
  selectedListId: null,
  setSelectedListId: (listId) => set({ selectedListId: listId }),

  // Theme
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  // Task modal
  isTaskModalOpen: false,
  selectedTaskId: null,
  openTaskModal: (taskId) => set({ isTaskModalOpen: true, selectedTaskId: taskId || null }),
  closeTaskModal: () => set({ isTaskModalOpen: false, selectedTaskId: null }),

  // List modal
  isListModalOpen: false,
  selectedListForEdit: null,
  openListModal: (listId) => set({ isListModalOpen: true, selectedListForEdit: listId || null }),
  closeListModal: () => set({ isListModalOpen: false, selectedListForEdit: null }),

  // Search & filters
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  statusFilter: null,
  setStatusFilter: (status) => set({ statusFilter: status }),
  priorityFilter: null,
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  tagFilters: [],
  setTagFilters: (tags) => set({ tagFilters: tags }),
  clearFilters: () =>
    set({
      searchQuery: '',
      statusFilter: null,
      priorityFilter: null,
      tagFilters: [],
    }),

  // View mode
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Sort
  sortBy: 'order',
  sortOrder: 'asc',
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
}));
