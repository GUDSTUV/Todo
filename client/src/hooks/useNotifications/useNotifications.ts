import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationApi from "../../api/notifications/notifications";
import toast from "react-hot-toast";

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

/**
 * Hook to fetch notifications
 */
export const useNotifications = (params?: {
  read?: boolean;
  limit?: number;
  skip?: number;
}) => {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationApi.getNotifications(params),
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to fetch unread count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to mark notifications as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      notificationApi.markAsRead(notificationIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(
        error.response?.data?.error || "Failed to mark notifications as read"
      );
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      toast.success("All notifications marked as read");
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(
        error.response?.data?.error || "Failed to mark all notifications as read"
      );
    },
  });
};

/**
 * Hook to delete notifications
 */
export const useDeleteNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      notificationApi.deleteNotifications(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification(s) deleted");
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(
        error.response?.data?.error || "Failed to delete notifications"
      );
    },
  });
};
