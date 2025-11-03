"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.createComment = exports.getTaskComments = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const Task_1 = __importDefault(require("../models/Task"));
const List_1 = __importDefault(require("../models/List"));
const User_1 = __importDefault(require("../models/User"));
const notificationService_1 = require("../services/notificationService");
const activityService_1 = require("../services/activityService");
// Helper to extract @mentions from text
const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]); // Extract username without @
    }
    return mentions;
};
// Helper to check if user has access to a task
const hasTaskAccess = async (taskId, userId) => {
    const task = await Task_1.default.findById(taskId);
    if (!task)
        return false;
    // If task has no list, check if user owns it
    if (!task.listId) {
        return task.userId.toString() === userId;
    }
    // Check if user has access to the list
    const list = await List_1.default.findOne({
        _id: task.listId,
        $or: [{ userId }, { "sharedWith.userId": userId }],
    });
    return !!list;
};
// Get all comments for a task
const getTaskComments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { taskId } = req.params;
        // Check if user has access to the task
        const hasAccess = await hasTaskAccess(taskId, userId);
        if (!hasAccess) {
            res.status(403).json({
                success: false,
                error: "Access denied to this task",
            });
            return;
        }
        const comments = await Comment_1.default.find({ taskId })
            .populate("userId", "name email avatarUrl")
            .sort({ createdAt: 1 })
            .lean();
        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments,
        });
    }
    catch (error) {
        console.error("Get task comments error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch comments",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getTaskComments = getTaskComments;
// Create a comment
const createComment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { taskId } = req.params;
        const { content } = req.body;
        if (!content || !content.trim()) {
            res.status(400).json({
                success: false,
                error: "Comment content is required",
            });
            return;
        }
        // Check if user has access to the task
        const hasAccess = await hasTaskAccess(taskId, userId);
        if (!hasAccess) {
            res.status(403).json({
                success: false,
                error: "Access denied to this task",
            });
            return;
        }
        // Extract mentions from content
        const mentionUsernames = extractMentions(content);
        const mentionedUserIds = [];
        if (mentionUsernames.length > 0) {
            // Find users by username (using email as username for now)
            const mentionedUsers = await User_1.default.find({
                name: { $in: mentionUsernames },
            }).select("_id name email");
            mentionedUserIds.push(...mentionedUsers.map((u) => u._id.toString()));
        }
        const comment = await Comment_1.default.create({
            taskId,
            userId,
            content: content.trim(),
            mentions: mentionedUserIds,
        });
        const populatedComment = await Comment_1.default.findById(comment._id)
            .populate("userId", "name email avatarUrl")
            .lean();
        // Get task details for notification
        const task = await Task_1.default.findById(taskId).select("title");
        const currentUser = await User_1.default.findById(userId).select("name");
        // Create notifications for mentioned users
        for (const mentionedUserId of mentionedUserIds) {
            if (mentionedUserId !== userId) {
                // Don't notify yourself
                await (0, notificationService_1.createNotification)({
                    userId: mentionedUserId,
                    taskId,
                    type: "mention",
                    title: "You were mentioned",
                    message: `${currentUser?.name} mentioned you in "${task?.title}"`,
                    actionUrl: `/tasks/${taskId}`,
                });
            }
        }
        // Log activity
        await (0, activityService_1.logActivity)({
            userId,
            taskId,
            listId: task?.listId,
            type: "comment_added",
            description: `${currentUser?.name} commented on "${task?.title}"`,
            visibility: "team",
        });
        res.status(201).json({
            success: true,
            data: populatedComment,
        });
    }
    catch (error) {
        console.error("Create comment error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create comment",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.createComment = createComment;
// Update a comment
const updateComment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { commentId } = req.params;
        const { content } = req.body;
        if (!content || !content.trim()) {
            res.status(400).json({
                success: false,
                error: "Comment content is required",
            });
            return;
        }
        // Find comment and check ownership
        const comment = await Comment_1.default.findOne({ _id: commentId, userId });
        if (!comment) {
            res.status(404).json({
                success: false,
                error: "Comment not found or you don't have permission to edit it",
            });
            return;
        }
        comment.content = content.trim();
        await comment.save();
        const populatedComment = await Comment_1.default.findById(comment._id)
            .populate("userId", "name email avatarUrl")
            .lean();
        res.status(200).json({
            success: true,
            data: populatedComment,
        });
    }
    catch (error) {
        console.error("Update comment error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update comment",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.updateComment = updateComment;
// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { commentId } = req.params;
        // Find comment and check ownership
        const comment = await Comment_1.default.findOne({ _id: commentId, userId });
        if (!comment) {
            res.status(404).json({
                success: false,
                error: "Comment not found or you don't have permission to delete it",
            });
            return;
        }
        await Comment_1.default.deleteOne({ _id: commentId });
        res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete comment error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete comment",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.deleteComment = deleteComment;
