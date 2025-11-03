"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const messageController_1 = require("../controllers/messageController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// Get all conversations
router.get("/conversations", messageController_1.getConversations);
// Get unread message count
router.get("/unread-count", messageController_1.getUnreadCount);
// Get messages with a specific user
router.get("/:otherUserId", messageController_1.getMessages);
// Send a message
router.post("/", messageController_1.sendMessage);
// Mark a message as read
router.patch("/:messageId/read", messageController_1.markAsRead);
exports.default = router;
