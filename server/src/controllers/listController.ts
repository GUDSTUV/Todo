/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import List from "../models/List";
import Task from "../models/Task";
import User from "../models/User";
import { getErrorMessage, isValidationError } from "../types/common";

// Get all lists for the authenticated user
export const getLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { includeArchived = false } = req.query;

    const query: any = { userId };
    if (!includeArchived || includeArchived === "false") {
      query.isArchived = false;
    }

    const lists = await List.find(query)
      .populate("sharedWith.userId", "name email avatarUrl")
      .sort({ order: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: lists.length,
      data: lists,
    });
  } catch (error) {
    console.error("Get lists error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch lists",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Get a single list
export const getList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const list = await List.findOne({ _id: id, userId }).populate(
      "sharedWith.userId",
      "name email avatarUrl"
    );

    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Get list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch list",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Create a new list
export const createList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const listData = { ...req.body, userId };

    // Prevent multiple default lists
    if (listData.isDefault) {
      await List.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    // Get the highest order value for the user
    if (listData.order === undefined) {
      const lastList = await List.findOne({ userId }).sort({ order: -1 });
      listData.order = lastList ? lastList.order + 1 : 0;
    }

    const list = await List.create(listData);

    res.status(201).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Create list error:", error);

    if (isValidationError(error)) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to create list",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Update a list
export const updateList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const list = await List.findOne({ _id: id, userId }).populate(
      "sharedWith.userId",
      "name email avatarUrl"
    );

    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    // Handle default list change
    if (updates.isDefault && !list.isDefault) {
      await List.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    // Update list fields
    Object.keys(updates).forEach((key) => {
      (list as any)[key] = updates[key];
    });

    await list.save();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Update list error:", error);

    if (isValidationError(error)) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to update list",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Delete a list (and optionally move tasks)
export const deleteList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { moveTasksToListId } = req.query;

    const list = await List.findOne({ _id: id, userId }).populate(
      "sharedWith.userId",
      "name email avatarUrl"
    );

    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    // Prevent deletion of default list
    if (list.isDefault) {
      res
        .status(400)
        .json({ success: false, error: "Cannot delete default list" });
      return;
    }

    // Handle tasks in the list
    if (moveTasksToListId) {
      // Move tasks to another list
      const targetList = await List.findOne({ _id: moveTasksToListId, userId });
      if (!targetList) {
        res
          .status(404)
          .json({ success: false, error: "Target list not found" });
        return;
      }
      await Task.updateMany(
        { listId: id, userId },
        { listId: moveTasksToListId }
      );
      await (targetList as any).updateTaskCount();
    } else {
      // Move tasks to inbox (null listId)
      await Task.updateMany({ listId: id, userId }, { listId: null });
    }

    await List.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      data: { message: "List successfully deleted" },
    });
  } catch (error) {
    console.error("Delete list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete list",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Archive/Unarchive a list
export const archiveList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { isArchived } = req.body;

    const list = await List.findOne({ _id: id, userId }).populate(
      "sharedWith.userId",
      "name email avatarUrl"
    );

    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    list.isArchived = isArchived;
    await list.save();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Archive list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to archive list",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Bulk update lists (e.g., for reordering)
export const bulkUpdateLists = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { updates } = req.body; // Array of { id, updates }

    if (!Array.isArray(updates)) {
      res
        .status(400)
        .json({ success: false, error: "Updates must be an array" });
      return;
    }

    const results = [];
    for (const update of updates) {
      const list = await List.findOne({ _id: update.id, userId });
      if (list) {
        Object.keys(update.updates).forEach((key) => {
          (list as any)[key] = update.updates[key];
        });
        await list.save();
        results.push(list);
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Bulk update lists error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk update lists",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Refresh task count for a list
export const refreshListTaskCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const list = await List.findOne({ _id: id, userId }).populate(
      "sharedWith.userId",
      "name email avatarUrl"
    );

    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    await list.updateTaskCount();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Refresh list task count error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh task count",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Share a list with another user
export const shareList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { email, role = "viewer" } = req.body;

    const list = await List.findOne({ _id: id, userId }).populate(
      "sharedWith.userId",
      "name email avatarUrl"
    );
    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    // Check if user is already a collaborator
    const targetUserId = targetUser.id;
    const existingCollaborator = list.sharedWith.find(
      (c) => c.userId.toString() === targetUserId
    );
    if (existingCollaborator) {
      res.status(400).json({
        success: false,
        error: "User is already a collaborator on this list",
      });
      return;
    }

    list.sharedWith.push({
      userId: targetUserId,
      role: role as "viewer" | "editor",
      invitedAt: new Date(),
    });

    await list.save();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Share list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to share list",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Remove a collaborator from a list
export const removeCollaborator = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id, collaboratorId } = req.params;

    const list = await List.findOne({ _id: id, userId }).populate(
      "sharedWith.userId",
      "name email avatarUrl"
    );
    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    const collaboratorIndex = list.sharedWith.findIndex(
      (c) => c.userId.toString() === collaboratorId
    );

    if (collaboratorIndex === -1) {
      res.status(404).json({ success: false, error: "Collaborator not found" });
      return;
    }

    list.sharedWith.splice(collaboratorIndex, 1);
    await list.save();

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove collaborator",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

// Leave a shared list
export const leaveSharedList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const list = await List.findOne({
      _id: id,
      "sharedWith.userId": userId,
    }).populate("sharedWith.userId", "name email avatarUrl");

    if (!list) {
      res.status(404).json({ success: false, error: "List not found" });
      return;
    }

    const collaboratorIndex = list.sharedWith.findIndex(
      (c) => c.userId.toString() === userId
    );

    if (collaboratorIndex === -1) {
      res.status(404).json({
        success: false,
        error: "You are not a collaborator on this list",
      });
      return;
    }

    list.sharedWith.splice(collaboratorIndex, 1);
    await list.save();

    res.status(200).json({
      success: true,
      data: { message: "Successfully left the list" },
    });
  } catch (error) {
    console.error("Leave shared list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to leave list",
      message:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};
