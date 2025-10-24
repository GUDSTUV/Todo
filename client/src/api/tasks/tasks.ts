import api from '../client/client';

export interface Task {
  _id: string;
  userId: string;
  listId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  subtasks: Array<{
    _id?: string;
    title: string;
    done: boolean;
  }>;
  dueDate?: string;
  reminderDate?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  order: number;
  attachments: Array<{
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  completedAt?: string;
  syncVersion: number;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  listId?: string | 'null';
  status?: string;
  priority?: string;
  tags?: string | string[];
  search?: string;
  dueDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTaskData {
  title: string;
  listId?: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  subtasks?: Array<{ title: string; done: boolean }>;
  dueDate?: string;
  reminderDate?: string;
  order?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  updatedAt?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  todo: number;
  byPriority: Array<{ _id: string; count: number }>;
  byList: Array<{
    _id: string;
    count: number;
    list?: { name: string; color: string };
  }>;
}

// Get all tasks
export const getTasks = async (filters?: TaskFilters) => {
  const response = await api.get<{ success: boolean; count: number; data: Task[] }>(
    '/tasks',
    { params: filters }
  );
  return response.data;
};

// Get a single task
export const getTask = async (id: string) => {
  const response = await api.get<{ success: boolean; data: Task }>(`/tasks/${id}`);
  return response.data;
};

// Create a task
export const createTask = async (data: CreateTaskData) => {
  const response = await api.post<{ success: boolean; data: Task }>('/tasks', data);
  return response.data;
};

// Update a task
export const updateTask = async (id: string, data: UpdateTaskData) => {
  const response = await api.patch<{ success: boolean; data: Task }>(`/tasks/${id}`, data);
  return response.data;
};

// Delete a task
export const deleteTask = async (id: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
  return response.data;
};

// Bulk update tasks
export const bulkUpdateTasks = async (
  updates: Array<{ id: string; updates: UpdateTaskData }>
) => {
  const response = await api.patch<{ success: boolean; count: number; data: Task[] }>(
    '/tasks/bulk',
    { updates }
  );
  return response.data;
};

// Get task statistics
export const getTaskStats = async () => {
  const response = await api.get<{ success: boolean; data: TaskStats }>('/tasks/stats');
  return response.data;
};
