import { api } from "../client/client";

export interface Activity {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  taskId?: {
    _id: string;
    title: string;
    status: string;
  };
  listId?: {
    _id: string;
    name: string;
  };
  type:
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "task_status_changed"
    | "task_assigned"
    | "comment_added"
    | "list_created"
    | "list_shared"
    | "collaborator_added"
    | "collaborator_removed";
  description: string;
  metadata?: Record<string, unknown>;
  visibility: "private" | "team";
  createdAt: string;
}

// Get user activities
export const getActivities = async (limit?: number, skip?: number) => {
  const response = await api.get<{ success: boolean; count: number; data: Activity[] }>(
    "/activities",
    { params: { limit, skip } }
  );
  return response.data;
};

// Get activities for a specific list
export const getListActivities = async (listId: string, limit?: number, skip?: number) => {
  const response = await api.get<{ success: boolean; count: number; data: Activity[] }>(
    `/activities/lists/${listId}`,
    { params: { limit, skip } }
  );
  return response.data;
};

// Get activities for a specific task
export const getTaskActivities = async (taskId: string, limit?: number, skip?: number) => {
  const response = await api.get<{ success: boolean; count: number; data: Activity[] }>(
    `/activities/tasks/${taskId}`,
    { params: { limit, skip } }
  );
  return response.data;
};
