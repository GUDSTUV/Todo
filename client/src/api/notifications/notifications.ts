import api from "../client/client";

export interface Notification {
  _id: string;
  userId: string;
  taskId?: string;
  type: "reminder" | "task_due" | "task_overdue" | "shared_list" | "comment" | "system";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    taskTitle?: string;
    listName?: string;
    priority?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

/**
 * Get all notifications
 */
export const getNotifications = async (params?: {
  read?: boolean;
  limit?: number;
  skip?: number;
}): Promise<Notification[]> => {
  const response = await api.get<NotificationsResponse>("/notifications", { params });
  return response.data.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<UnreadCountResponse>("/notifications/unread-count");
  return response.data.data.count;
};

/**
 * Mark notifications as read
 */
export const markAsRead = async (notificationIds: string[]): Promise<void> => {
  await api.patch("/notifications/read", { notificationIds });
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

/**
 * Delete notifications
 */
export const deleteNotifications = async (notificationIds: string[]): Promise<void> => {
  await api.delete("/notifications", { data: { notificationIds } });
};

/**
 * Create test notification (development only)
 */
export const createTestNotification = async (
  title: string,
  message: string,
  type?: string
): Promise<Notification> => {
  const response = await api.post<{ success: boolean; data: Notification }>(
    "/notifications/test",
    { title, message, type }
  );
  return response.data.data;
};

/**
 * Manually process notifications (development only)
 */
export type ProcessResults = Record<string, { processed: number; errors: number }>;

export const processNotifications = async (
  kind?: "reminders" | "due-today" | "overdue" | "all"
): Promise<{ totalProcessed: number; results: ProcessResults }> => {
  const response = await api.post<{
    success: boolean;
    data: { kind: string; totalProcessed: number; results: ProcessResults };
  }>("/notifications/process", { kind });
  return {
    totalProcessed: response.data.data.totalProcessed,
    results: response.data.data.results,
  };
};
