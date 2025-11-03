"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.markAsRead = exports.sendMessage = exports.getMessages = exports.getConversations = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const notificationService = __importStar(require("../services/notificationService"));
// Get all conversations for the current user
const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Get all messages where user is sender or receiver
        const messages = await Message_1.default.aggregate([
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
        const conversations = await Promise.all(messages.map(async (conv) => {
            const otherUserId = conv.lastMessage.senderId.toString() === userId.toString()
                ? conv.lastMessage.receiverId
                : conv.lastMessage.senderId;
            const otherUser = await User_1.default.findById(otherUserId).select("name email avatarUrl");
            return {
                conversationId: conv._id,
                otherUser,
                lastMessage: {
                    content: conv.lastMessage.content,
                    createdAt: conv.lastMessage.createdAt,
                    isFromMe: conv.lastMessage.senderId.toString() === userId.toString(),
                },
                unreadCount: conv.unreadCount,
            };
        }));
        res.json(conversations);
    }
    catch {
        res.status(500).json({ message: "Failed to fetch conversations" });
    }
};
exports.getConversations = getConversations;
// Get messages for a specific conversation
const getMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { otherUserId } = req.params;
        // Verify other user exists
        const otherUser = await User_1.default.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const conversationId = Message_1.default.generateConversationId(userId, otherUserId);
        const messages = await Message_1.default.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate("senderId", "name email avatarUrl")
            .populate("receiverId", "name email avatarUrl")
            .limit(100); // Last 100 messages
        // Mark messages as read
        await Message_1.default.updateMany({
            conversationId,
            receiverId: userId,
            isRead: false,
        }, {
            isRead: true,
            readAt: new Date(),
        });
        res.json(messages);
    }
    catch {
        res.status(500).json({ message: "Failed to fetch messages" });
    }
};
exports.getMessages = getMessages;
// Send a message
const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        const receiver = await User_1.default.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }
        const conversationId = Message_1.default.generateConversationId(userId, receiverId);
        const message = await Message_1.default.create({
            senderId: userId,
            receiverId,
            content: content.trim(),
            conversationId,
            isRead: false,
        });
        await message.populate("senderId", "name email avatarUrl");
        await message.populate("receiverId", "name email avatarUrl");
        // Get sender name for notification
        const sender = await User_1.default.findById(userId).select("name");
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
    }
    catch {
        res.status(500).json({ message: "Failed to send message" });
    }
};
exports.sendMessage = sendMessage;
// Mark message as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { messageId } = req.params;
        const message = await Message_1.default.findOne({
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
    }
    catch {
        res.status(500).json({ message: "Failed to mark message as read" });
    }
};
exports.markAsRead = markAsRead;
// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await Message_1.default.countDocuments({
            receiverId: userId,
            isRead: false,
        });
        res.json({ count });
    }
    catch {
        res.status(500).json({ message: "Failed to get unread count" });
    }
};
exports.getUnreadCount = getUnreadCount;
