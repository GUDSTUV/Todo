// import api from './client/client';

import api from "../client/client";

export interface List {
  _id: string;
  userId: string | { _id: string; name: string; email: string; avatarUrl?: string };
  name: string;
  description?: string;
  color: string;
  icon: string;
  order: number;
  isDefault: boolean;
  isArchived: boolean;
  taskCount: number;
  syncVersion: number;
  lastModified: string;
  sharedWith: Array<{
    userId: { _id: string; name: string; email: string; avatarUrl?: string };
    role: "viewer" | "editor";
    invitedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  isDefault?: boolean;
}

export interface UpdateListData extends Partial<CreateListData> {
  id: string;
}

// Get all lists
export const getLists = async (includeArchived = false) => {
  const response = await api.get<{ success: boolean; count: number; data: List[] }>(
    '/lists',
    { params: { includeArchived } }
  );
  return response.data;
};

// Get a single list
export const getList = async (id: string) => {
  const response = await api.get<{ success: boolean; data: List }>(`/lists/${id}`);
  return response.data;
};

// Create a list
export const createList = async (data: CreateListData) => {
  const response = await api.post<{ success: boolean; data: List }>('/lists', data);
  return response.data;
};

// Update a list
export const updateList = async (id: string, data: UpdateListData) => {
  const response = await api.patch<{ success: boolean; data: List }>(`/lists/${id}`, data);
  return response.data;
};

// Delete a list
export const deleteList = async (id: string, moveTasksToListId?: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/lists/${id}`,
    { params: { moveTasksToListId } }
  );
  return response.data;
};

// Archive/unarchive a list
export const archiveList = async (id: string, isArchived: boolean) => {
  const response = await api.patch<{ success: boolean; data: List }>(
    `/lists/${id}/archive`,
    { isArchived }
  );
  return response.data;
};

// Bulk update lists
export const bulkUpdateLists = async (
  updates: Array<{ id: string; updates: UpdateListData }>
) => {
  const response = await api.patch<{ success: boolean; count: number; data: List[] }>(
    '/lists/bulk',
    { updates }
  );
  return response.data;
};

// Refresh list task count
export const refreshListTaskCount = async (id: string) => {
  const response = await api.post<{ success: boolean; data: List }>(
    `/lists/${id}/refresh-count`
  );
  return response.data;
};

// Share a list with another user
export const shareList = async (id: string, email: string, role: "viewer" | "editor" = "viewer") => {
  const response = await api.post<{ success: boolean; message: string; data: List }>(
    `/lists/${id}/share`,
    { email, role }
  );
  return response.data;
};

// Remove a collaborator from a list
export const removeCollaborator = async (id: string, collaboratorId: string) => {
  const response = await api.delete<{ success: boolean; message: string; data: List }>(
    `/lists/${id}/collaborators/${collaboratorId}`
  );
  return response.data;
};

// Leave a shared list
export const leaveSharedList = async (id: string) => {
  const response = await api.post<{ success: boolean; message: string }>(
    `/lists/${id}/leave`
  );
  return response.data;
};
