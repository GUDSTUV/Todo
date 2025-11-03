import { Router } from "express";
import { protect } from "../middleware/auth";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from "../controllers/messageController";

const router = Router();

// All routes require authentication
router.use(protect);

// Get all conversations
router.get("/conversations", getConversations);

// Get unread message count
router.get("/unread-count", getUnreadCount);

// Get messages with a specific user
router.get("/:otherUserId", getMessages);

// Send a message
router.post("/", sendMessage);

// Mark a message as read
router.patch("/:messageId/read", markAsRead);

export default router;
