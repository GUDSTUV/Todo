import { Request, Response } from "express";
import Message from "../models/Message";
import User from "../models/User";
import * as notificationService from "../services/notificationService";

// Get all conversations for the current user
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all messages where user is sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    // Populate user details for each conversation
    const conversations = await Promise.all(
      messages.map(async (conv) => {
        const otherUserId =
          conv.lastMessage.senderId.toString() === userId.toString()
            ? conv.lastMessage.receiverId
            : conv.lastMessage.senderId;

        const otherUser = await User.findById(otherUserId).select(
          "name email avatarUrl"
        );

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
            isFromMe:
              conv.lastMessage.senderId.toString() === userId.toString(),
          },
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.json(conversations);
  } catch {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { otherUserId } = req.params;

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversationId = Message.generateConversationId(userId, otherUserId);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatarUrl")
      .populate("receiverId", "name email avatarUrl")
      .limit(100); // Last 100 messages

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json(messages);
  } catch {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res
        .status(400)
        .json({ message: "Receiver and content are required" });
    }

    if (receiverId === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot send message to yourself" });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const conversationId = Message.generateConversationId(userId, receiverId);

    const message = await Message.create({
      senderId: userId,
      receiverId,
      content: content.trim(),
      conversationId,
      isRead: false,
    });

    await message.populate("senderId", "name email avatarUrl");
    await message.populate("receiverId", "name email avatarUrl");

    // Get sender name for notification
    const sender = await User.findById(userId).select("name");
    const senderName = sender?.name || "A user";

    // Send in-app notification
    await notificationService.createNotification({
      userId: receiverId,
      type: "message",
      title: "New Message",
      message: `New message from ${senderName}`,
      metadata: {
        messageId: String(message._id),
        senderId: userId.toString(),
      },
    });

    res.status(201).json(message);
  } catch {
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Mark message as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      receiverId: userId,
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json(message);
  } catch {
    res.status(500).json({ message: "Failed to mark message as read" });
  }
};

// Get unread message count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const count = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    res.json({ count });
  } catch {
    res.status(500).json({ message: "Failed to get unread count" });
  }
};
