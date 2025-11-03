import { Request, Response } from "express";
import Task from "../models/Task";
import List from "../models/List";
import mongoose from "mongoose";
import { logActivity } from "../services/activityService";

// Helper function to check if user has access to a list (owner or collaborator)
const hasListAccess = async (
  listId: string | null,
  userId: string
): Promise<boolean> => {
  if (!listId) return true; // Tasks without a list belong to the user

  const list = await List.findOne({
    _id: listId,
    $or: [{ userId }, { "sharedWith.userId": userId }],
  });

  return !!list;
};

// Helper function to check if user can edit a list (owner or editor)
const canEditList = async (
  listId: string | null,
  userId: string
): Promise<boolean> => {
  if (!listId) return true; // Tasks without a list can be edited by owner

  const list = await List.findOne({
    _id: listId,
    $or: [
      { userId }, // Owner
      { sharedWith: { $elemMatch: { userId, role: "editor" } } }, // Editor
    ],
  });

  return !!list;
};

// Get all tasks for the authenticated user (including shared lists)
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const {
      listId,
      status,
      priority,
      tags,
      search,
      dueDate,
      sortBy = "order",
      sortOrder = "asc",
    } = req.query;

    // Get all lists accessible to the user (owned or shared)
    const accessibleLists = await List.find({
      $or: [{ userId }, { "sharedWith.userId": userId }],
    }).select("_id");

    const accessibleListIds = accessibleLists.map((list) => list._id);

    // Build query - include tasks from accessible lists OR tasks without a list (owned by user)
    const query: any = {
      $or: [
        { userId }, // User's own tasks
        { listId: { $in: accessibleListIds } }, // Tasks in shared lists
      ],
    };

    if (listId) {
      if (listId === "null") {
        query.listId = null;
        delete query.$or; // Only show user's own tasks without a list
        query.userId = userId;
      } else {
        // Verify user has access to this specific list
        if (!(await hasListAccess(listId as string, userId))) {
          res.status(403).json({ success: false, error: "Access denied" });
          return;
        }
        query.listId = listId;
        delete query.$or;
      }
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (dueDate) {
      const date = new Date(dueDate as string);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.dueDate = { $gte: date, $lt: nextDay };
    }

    // Sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const tasks = await Task.find(query).sort(sort).lean();

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error: any) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get a single task
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // First, try to find the task
    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    // Check if user owns the task
    if (task.userId.toString() === userId) {
      res.status(200).json({
        success: true,
        data: task,
      });
      return;
    }

    // Check if user has access through a shared list
    const list = await List.findOne({
      _id: task.listId,
      "sharedWith.userId": userId,
    });

    if (!list) {
      res.status(403).json({
        success: false,
        error: "You don't have permission to view this task",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch task",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create a new task
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const taskData = { ...req.body, userId };

    // Validate listId if provided and check edit permissions
    if (taskData.listId) {
      if (!(await canEditList(taskData.listId, userId))) {
        res.status(403).json({
          success: false,
          error: "You don't have permission to add tasks to this list",
        });
        return;
      }
    }

    // Get the highest order value for the user
    if (taskData.order === undefined) {
      const lastTask = await Task.findOne({ userId }).sort({ order: -1 });
      taskData.order = lastTask ? lastTask.order + 1 : 0;
    }

    const task = await Task.create(taskData);

    // Update list task count if task is in a list
    if (task.listId) {
      const list = await List.findById(task.listId);
      if (list) {
        await (list as any).updateTaskCount();
      }
    }

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error("Create task error:", error);

    if (error.name === "ValidationError") {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to create task",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update a task
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const updates = req.body;

    // Find the task
    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    // Check if user can edit this task (owner or has edit access to the list)
    const taskOwnedByUser = task.userId.toString() === userId.toString();
    const hasEditAccess = task.listId
      ? await canEditList(task.listId.toString(), userId)
      : false;

    if (!taskOwnedByUser && !hasEditAccess) {
      res.status(403).json({
        success: false,
        error: "You don't have permission to edit this task",
      });
      return;
    }

    // Validate new listId if being updated
    if (updates.listId && updates.listId !== task.listId?.toString()) {
      if (!(await canEditList(updates.listId, userId))) {
        res.status(403).json({
          success: false,
          error: "You don't have permission to move tasks to this list",
        });
        return;
      }
    }

    const oldListId = task.listId;
    const oldStatus = task.status;

    // Update task fields
    Object.keys(updates).forEach((key) => {
      (task as any)[key] = updates[key];
    });

    await task.save();

    // Log activity for status change
    if (updates.status && updates.status !== oldStatus) {
      await logActivity({
        userId,
        taskId: task._id as mongoose.Types.ObjectId,
        listId: task.listId,
        type: "task_status_changed",
        description: `Status changed from "${oldStatus}" to "${updates.status}"`,
        metadata: { oldStatus, newStatus: updates.status },
        visibility: "team",
      });
    }

    // Update task counts for affected lists
    if (oldListId && oldListId.toString() !== task.listId?.toString()) {
      const oldList = await List.findById(oldListId);
      if (oldList) {
        await (oldList as any).updateTaskCount();
      }
    }

    if (task.listId) {
      const newList = await List.findById(task.listId);
      if (newList) {
        await (newList as any).updateTaskCount();
      }
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error("Update task error:", error);

    if (error.name === "ValidationError") {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to update task",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a task
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    // Check if user can delete this task (owner or has edit access to the list)
    const taskOwnedByUser = task.userId.toString() === userId.toString();
    const hasEditAccess = task.listId
      ? await canEditList(task.listId.toString(), userId)
      : false;

    if (!taskOwnedByUser && !hasEditAccess) {
      res.status(403).json({
        success: false,
        error: "You don't have permission to delete this task",
      });
      return;
    }

    const listId = task.listId;

    await task.deleteOne();

    // Update list task count
    if (listId) {
      const list = await List.findById(listId);
      if (list) {
        await (list as any).updateTaskCount();
      }
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete task",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Bulk update tasks (e.g., for reordering or bulk status changes)
export const bulkUpdateTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { updates } = req.body; // Array of { id, updates }

    if (!Array.isArray(updates)) {
      res
        .status(400)
        .json({ success: false, error: "Updates must be an array" });
      return;
    }

    const results = [];
    for (const update of updates) {
      const task = await Task.findOne({ _id: update.id, userId });
      if (task) {
        Object.keys(update.updates).forEach((key) => {
          (task as any)[key] = update.updates[key];
        });
        await task.save();
        results.push(task);
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error("Bulk update tasks error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk update tasks",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get task statistics for dashboard
export const getTaskStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const [total, completed, inProgress, overdue] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: "done" }),
      Task.countDocuments({ userId, status: "in-progress" }),
      Task.countDocuments({
        userId,
        status: { $ne: "done" },
        dueDate: { $lt: new Date() },
      }),
    ]);

    const byPriority = await Task.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $ne: "done" },
        },
      },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const byList = await Task.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $ne: "done" },
        },
      },
      {
        $group: {
          _id: "$listId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "lists",
          localField: "_id",
          foreignField: "_id",
          as: "list",
        },
      },
      { $unwind: { path: "$list", preserveNullAndEmptyArrays: true } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        overdue,
        todo: total - completed - inProgress,
        byPriority,
        byList,
      },
    });
  } catch (error: any) {
    console.error("Get task stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch task statistics",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
