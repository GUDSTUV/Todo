import type { Task } from '../../api/tasks/tasks';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiTasksResponse {
  success: boolean;
  count: number;
  data: Task[];
}

export interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}
