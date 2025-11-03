import express from "express";
import {
  getNotifications,
  getNotificationUnreadCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createTestNotification,
  processNotificationsNow,
} from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// Get all notifications for the user
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getNotificationUnreadCount);

// Mark notifications as read
router.patch("/read", markNotificationsAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

// Delete notifications
router.delete("/", deleteNotification);

// Create test notification (development only)
router.post("/test", createTestNotification);

// Manually trigger processors (development only)
router.post("/process", processNotificationsNow);

export default router;
