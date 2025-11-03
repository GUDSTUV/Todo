import { Request, Response } from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotifications,
  createNotification,
  processDueReminders,
  processTasksDueToday,
  processOverdueTasks,
} from "../services/notificationService";

/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 * Query params: read (boolean), limit (number), skip (number)
 */
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { read, limit, skip } = req.query;

    const options: any = {};

    if (read !== undefined) {
      options.read = read === "true";
    }

    if (limit) {
      options.limit = parseInt(limit as string, 10);
    }

    if (skip) {
      options.skip = parseInt(skip as string, 10);
    }

    const notifications = await getUserNotifications(userId, options);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getNotificationUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const count = await getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Mark notification(s) as read
 * PATCH /api/notifications/read
 * Body: { notificationIds: string[] }
 */
export const markNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      res.status(400).json({
        success: false,
        error: "notificationIds must be an array",
      });
      return;
    }

    if (notificationIds.length === 0) {
      res.status(400).json({
        success: false,
        error: "notificationIds array cannot be empty",
      });
      return;
    }

    const modifiedCount = await markAsRead(notificationIds, userId);

    res.status(200).json({
      success: true,
      message: `${modifiedCount} notification(s) marked as read`,
      data: { modifiedCount },
    });
  } catch (error: any) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notifications as read",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const modifiedCount = await markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `${modifiedCount} notification(s) marked as read`,
      data: { modifiedCount },
    });
  } catch (error: any) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Delete notification(s)
 * DELETE /api/notifications
 * Body: { notificationIds: string[] }
 */
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      res.status(400).json({
        success: false,
        error: "notificationIds must be an array",
      });
      return;
    }

    if (notificationIds.length === 0) {
      res.status(400).json({
        success: false,
        error: "notificationIds array cannot be empty",
      });
      return;
    }

    const deletedCount = await deleteNotifications(notificationIds, userId);

    res.status(200).json({
      success: true,
      message: `${deletedCount} notification(s) deleted`,
      data: { deletedCount },
    });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notifications",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Create a test notification (for development/testing)
 * POST /api/notifications/test
 * Body: { title: string, message: string, type?: string }
 */
export const createTestNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({
        success: false,
        error: "This endpoint is only available in development",
      });
      return;
    }

    const userId = (req as any).user.userId;
    const { title, message, type = "system" } = req.body;

    if (!title || !message) {
      res.status(400).json({
        success: false,
        error: "title and message are required",
      });
      return;
    }

    const notification = await createNotification({
      userId,
      type: type as any,
      title,
      message,
      actionUrl: "/dashboard",
    });

    res.status(201).json({
      success: true,
      message: "Test notification created",
      data: notification,
    });
  } catch (error: any) {
    console.error("Create test notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create test notification",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Manually trigger notification processors (development only)
 * POST /api/notifications/process
 * Body: { kind?: 'reminders' | 'due-today' | 'overdue' | 'all' }
 */
export const processNotificationsNow = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({
        success: false,
        error: "This endpoint is only available in development",
      });
      return;
    }

    const kind = (req.body?.kind ?? "all") as string;
    const results: Record<string, { processed: number; errors: number }> = {};

    if (kind === "reminders" || kind === "all") {
      results.reminders = await processDueReminders();
    }
    if (kind === "due-today" || kind === "all") {
      results.dueToday = await processTasksDueToday();
    }
    if (kind === "overdue" || kind === "all") {
      results.overdue = await processOverdueTasks();
    }

    const totalProcessed = Object.values(results).reduce(
      (acc, r) => acc + (r?.processed || 0),
      0
    );

    res.status(200).json({
      success: true,
      message: "Processors executed",
      data: { kind, totalProcessed, results },
    });
  } catch (error: any) {
    console.error("Process notifications now error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process notifications",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
