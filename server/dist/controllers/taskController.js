"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskStats = exports.bulkUpdateTasks = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTask = exports.getTasks = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const List_1 = __importDefault(require("../models/List"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get all tasks for the authenticated user
const getTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { listId, status, priority, tags, search, dueDate, sortBy = "order", sortOrder = "asc", } = req.query;
        // Build query
        const query = { userId };
        if (listId) {
            if (listId === "null") {
                query.listId = null;
            }
            else {
                query.listId = listId;
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
            const date = new Date(dueDate);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            query.dueDate = { $gte: date, $lt: nextDay };
        }
        // Sort
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const tasks = await Task_1.default.find(query).sort(sort).lean();
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks,
        });
    }
    catch (error) {
        console.error("Get tasks error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch tasks",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getTasks = getTasks;
// Get a single task
const getTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const task = await Task_1.default.findOne({ _id: id, userId });
        if (!task) {
            res.status(404).json({ success: false, error: "Task not found" });
            return;
        }
        res.status(200).json({
            success: true,
            data: task,
        });
    }
    catch (error) {
        console.error("Get task error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch task",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getTask = getTask;
// Create a new task
const createTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const taskData = { ...req.body, userId };
        // Validate listId if provided
        if (taskData.listId) {
            const list = await List_1.default.findOne({ _id: taskData.listId, userId });
            if (!list) {
                res.status(404).json({ success: false, error: "List not found" });
                return;
            }
        }
        // Get the highest order value for the user
        if (taskData.order === undefined) {
            const lastTask = await Task_1.default.findOne({ userId }).sort({ order: -1 });
            taskData.order = lastTask ? lastTask.order + 1 : 0;
        }
        const task = await Task_1.default.create(taskData);
        // Update list task count if task is in a list
        if (task.listId) {
            const list = await List_1.default.findById(task.listId);
            if (list) {
                await list.updateTaskCount();
            }
        }
        res.status(201).json({
            success: true,
            data: task,
        });
    }
    catch (error) {
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
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.createTask = createTask;
// Update a task
const updateTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const updates = req.body;
        // Validate listId if being updated
        if (updates.listId) {
            const list = await List_1.default.findOne({ _id: updates.listId, userId });
            if (!list) {
                res.status(404).json({ success: false, error: "List not found" });
                return;
            }
        }
        const task = await Task_1.default.findOne({ _id: id, userId });
        if (!task) {
            res.status(404).json({ success: false, error: "Task not found" });
            return;
        }
        const oldListId = task.listId;
        // Update task fields
        Object.keys(updates).forEach((key) => {
            task[key] = updates[key];
        });
        await task.save();
        // Update task counts for affected lists
        if (oldListId && oldListId.toString() !== task.listId?.toString()) {
            const oldList = await List_1.default.findById(oldListId);
            if (oldList) {
                await oldList.updateTaskCount();
            }
        }
        if (task.listId) {
            const newList = await List_1.default.findById(task.listId);
            if (newList) {
                await newList.updateTaskCount();
            }
        }
        res.status(200).json({
            success: true,
            data: task,
        });
    }
    catch (error) {
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
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.updateTask = updateTask;
// Delete a task
const deleteTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const task = await Task_1.default.findOne({ _id: id, userId });
        if (!task) {
            res.status(404).json({ success: false, error: "Task not found" });
            return;
        }
        const listId = task.listId;
        await task.deleteOne();
        // Update list task count
        if (listId) {
            const list = await List_1.default.findById(listId);
            if (list) {
                await list.updateTaskCount();
            }
        }
        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete task",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.deleteTask = deleteTask;
// Bulk update tasks (e.g., for reordering or bulk status changes)
const bulkUpdateTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { updates } = req.body; // Array of { id, updates }
        if (!Array.isArray(updates)) {
            res
                .status(400)
                .json({ success: false, error: "Updates must be an array" });
            return;
        }
        const results = [];
        for (const update of updates) {
            const task = await Task_1.default.findOne({ _id: update.id, userId });
            if (task) {
                Object.keys(update.updates).forEach((key) => {
                    task[key] = update.updates[key];
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
    }
    catch (error) {
        console.error("Bulk update tasks error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to bulk update tasks",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.bulkUpdateTasks = bulkUpdateTasks;
// Get task statistics for dashboard
const getTaskStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [total, completed, inProgress, overdue] = await Promise.all([
            Task_1.default.countDocuments({ userId }),
            Task_1.default.countDocuments({ userId, status: "done" }),
            Task_1.default.countDocuments({ userId, status: "in-progress" }),
            Task_1.default.countDocuments({
                userId,
                status: { $ne: "done" },
                dueDate: { $lt: new Date() },
            }),
        ]);
        const byPriority = await Task_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    status: { $ne: "done" },
                },
            },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);
        const byList = await Task_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
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
    }
    catch (error) {
        console.error("Get task stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch task statistics",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getTaskStats = getTaskStats;
