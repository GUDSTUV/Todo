import { Request, Response } from "express";
import mongoose from "mongoose";
import Comment from "../models/Comment";
import Task from "../models/Task";
import List from "../models/List";
import User from "../models/User";
import { createNotification } from "../services/notificationService";
import { logActivity } from "../services/activityService";

// Helper to extract @mentions from text
const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]); // Extract username without @
  }

  return mentions;
};

// Helper to check if user has access to a task
const hasTaskAccess = async (
  taskId: string,
  userId: string
): Promise<boolean> => {
  const task = await Task.findById(taskId);
  if (!task) return false;

  // If task has no list, check if user owns it
  if (!task.listId) {
    return task.userId.toString() === userId;
  }

  // Check if user has access to the list
  const list = await List.findOne({
    _id: task.listId,
    $or: [{ userId }, { "sharedWith.userId": userId }],
  });

  return !!list;
};

// Get all comments for a task
export const getTaskComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
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

    const comments = await Comment.find({ taskId })
      .populate("userId", "name email avatarUrl")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error: any) {
    console.error("Get task comments error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch comments",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create a comment
export const createComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
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
    const mentionedUserIds: string[] = [];

    if (mentionUsernames.length > 0) {
      // Find users by username (using email as username for now)
      const mentionedUsers = await User.find({
        name: { $in: mentionUsernames },
      }).select("_id name email");

      mentionedUserIds.push(
        ...mentionedUsers.map((u) =>
          (u._id as mongoose.Types.ObjectId).toString()
        )
      );
    }

    const comment = await Comment.create({
      taskId,
      userId,
      content: content.trim(),
      mentions: mentionedUserIds,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "name email avatarUrl")
      .lean();

    // Get task details for notification
    const task = await Task.findById(taskId).select("title");
    const currentUser = await User.findById(userId).select("name");

    // Create notifications for mentioned users
    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId !== userId) {
        // Don't notify yourself
        await createNotification({
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
    await logActivity({
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
  } catch (error: any) {
    console.error("Create comment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create comment",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update a comment
export const updateComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
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
    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
      res.status(404).json({
        success: false,
        error: "Comment not found or you don't have permission to edit it",
      });
      return;
    }

    comment.content = content.trim();
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "name email avatarUrl")
      .lean();

    res.status(200).json({
      success: true,
      data: populatedComment,
    });
  } catch (error: any) {
    console.error("Update comment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update comment",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a comment
export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { commentId } = req.params;

    // Find comment and check ownership
    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
      res.status(404).json({
        success: false,
        error: "Comment not found or you don't have permission to delete it",
      });
      return;
    }

    await Comment.deleteOne({ _id: commentId });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete comment",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
