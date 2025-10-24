import type { List } from '../../api/lists/lists';

export interface UseListsOptions {
  includeArchived?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiListsResponse {
  success: boolean;
  count: number;
  data: List[];
}

export interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}