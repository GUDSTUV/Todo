"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All notification routes require authentication
router.use(auth_1.protect);
// Get all notifications for the user
router.get("/", notificationController_1.getNotifications);
// Get unread notification count
router.get("/unread-count", notificationController_1.getNotificationUnreadCount);
// Mark notifications as read
router.patch("/read", notificationController_1.markNotificationsAsRead);
// Mark all notifications as read
router.patch("/read-all", notificationController_1.markAllNotificationsAsRead);
// Delete notifications
router.delete("/", notificationController_1.deleteNotification);
// Create test notification (development only)
router.post("/test", notificationController_1.createTestNotification);
// Manually trigger processors (development only)
router.post("/process", notificationController_1.processNotificationsNow);
exports.default = router;
