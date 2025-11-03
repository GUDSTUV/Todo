"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNotificationsNow = exports.createTestNotification = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationsAsRead = exports.getNotificationUnreadCount = exports.getNotifications = void 0;
const notificationService_1 = require("../services/notificationService");
/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 * Query params: read (boolean), limit (number), skip (number)
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { read, limit, skip } = req.query;
        const options = {};
        if (read !== undefined) {
            options.read = read === "true";
        }
        if (limit) {
            options.limit = parseInt(limit, 10);
        }
        if (skip) {
            options.skip = parseInt(skip, 10);
        }
        const notifications = await (0, notificationService_1.getUserNotifications)(userId, options);
        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications,
        });
    }
    catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch notifications",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getNotifications = getNotifications;
/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
const getNotificationUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await (0, notificationService_1.getUnreadCount)(userId);
        res.status(200).json({
            success: true,
            data: { count },
        });
    }
    catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch unread count",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getNotificationUnreadCount = getNotificationUnreadCount;
/**
 * Mark notification(s) as read
 * PATCH /api/notifications/read
 * Body: { notificationIds: string[] }
 */
const markNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        const modifiedCount = await (0, notificationService_1.markAsRead)(notificationIds, userId);
        res.status(200).json({
            success: true,
            message: `${modifiedCount} notification(s) marked as read`,
            data: { modifiedCount },
        });
    }
    catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to mark notifications as read",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.markNotificationsAsRead = markNotificationsAsRead;
/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const modifiedCount = await (0, notificationService_1.markAllAsRead)(userId);
        res.status(200).json({
            success: true,
            message: `${modifiedCount} notification(s) marked as read`,
            data: { modifiedCount },
        });
    }
    catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to mark all notifications as read",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
/**
 * Delete notification(s)
 * DELETE /api/notifications
 * Body: { notificationIds: string[] }
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        const deletedCount = await (0, notificationService_1.deleteNotifications)(notificationIds, userId);
        res.status(200).json({
            success: true,
            message: `${deletedCount} notification(s) deleted`,
            data: { deletedCount },
        });
    }
    catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete notifications",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.deleteNotification = deleteNotification;
/**
 * Create a test notification (for development/testing)
 * POST /api/notifications/test
 * Body: { title: string, message: string, type?: string }
 */
const createTestNotification = async (req, res) => {
    try {
        // Only allow in development
        if (process.env.NODE_ENV === "production") {
            res.status(403).json({
                success: false,
                error: "This endpoint is only available in development",
            });
            return;
        }
        const userId = req.user.userId;
        const { title, message, type = "system" } = req.body;
        if (!title || !message) {
            res.status(400).json({
                success: false,
                error: "title and message are required",
            });
            return;
        }
        const notification = await (0, notificationService_1.createNotification)({
            userId,
            type: type,
            title,
            message,
            actionUrl: "/dashboard",
        });
        res.status(201).json({
            success: true,
            message: "Test notification created",
            data: notification,
        });
    }
    catch (error) {
        console.error("Create test notification error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create test notification",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.createTestNotification = createTestNotification;
/**
 * Manually trigger notification processors (development only)
 * POST /api/notifications/process
 * Body: { kind?: 'reminders' | 'due-today' | 'overdue' | 'all' }
 */
const processNotificationsNow = async (req, res) => {
    try {
        if (process.env.NODE_ENV === "production") {
            res.status(403).json({
                success: false,
                error: "This endpoint is only available in development",
            });
            return;
        }
        const kind = (req.body?.kind ?? "all");
        const results = {};
        if (kind === "reminders" || kind === "all") {
            results.reminders = await (0, notificationService_1.processDueReminders)();
        }
        if (kind === "due-today" || kind === "all") {
            results.dueToday = await (0, notificationService_1.processTasksDueToday)();
        }
        if (kind === "overdue" || kind === "all") {
            results.overdue = await (0, notificationService_1.processOverdueTasks)();
        }
        const totalProcessed = Object.values(results).reduce((acc, r) => acc + (r?.processed || 0), 0);
        res.status(200).json({
            success: true,
            message: "Processors executed",
            data: { kind, totalProcessed, results },
        });
    }
    catch (error) {
        console.error("Process notifications now error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process notifications",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.processNotificationsNow = processNotificationsNow;
