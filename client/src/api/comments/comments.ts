import { api } from "../client/client";

export interface Comment {
  _id: string;
  taskId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  mentions?: string[]; // User IDs mentioned in the comment
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
}

// Get all comments for a task
export const getTaskComments = async (taskId: string) => {
  const response = await api.get<{ success: boolean; count: number; data: Comment[] }>(
    `/tasks/${taskId}/comments`
  );
  return response.data;
};

// Create a new comment
export const createComment = async (taskId: string, data: CreateCommentData) => {
  const response = await api.post<{ success: boolean; data: Comment }>(
    `/tasks/${taskId}/comments`,
    data
  );
  return response.data;
};

// Update a comment
export const updateComment = async (commentId: string, data: CreateCommentData) => {
  const response = await api.patch<{ success: boolean; data: Comment }>(
    `/comments/${commentId}`,
    data
  );
  return response.data;
};

// Delete a comment
export const deleteComment = async (commentId: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/comments/${commentId}`
  );
  return response.data;
};
