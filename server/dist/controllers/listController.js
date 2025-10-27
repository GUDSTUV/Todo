"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshListTaskCount = exports.bulkUpdateLists = exports.archiveList = exports.deleteList = exports.updateList = exports.createList = exports.getList = exports.getLists = void 0;
const List_1 = __importDefault(require("../models/List"));
const Task_1 = __importDefault(require("../models/Task"));
// Get all lists for the authenticated user
const getLists = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { includeArchived = false } = req.query;
        const query = { userId };
        if (!includeArchived || includeArchived === "false") {
            query.isArchived = false;
        }
        const lists = await List_1.default.find(query).sort({ order: 1 }).lean();
        res.status(200).json({
            success: true,
            count: lists.length,
            data: lists,
        });
    }
    catch (error) {
        console.error("Get lists error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch lists",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getLists = getLists;
// Get a single list
const getList = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const list = await List_1.default.findOne({ _id: id, userId });
        if (!list) {
            res.status(404).json({ success: false, error: "List not found" });
            return;
        }
        res.status(200).json({
            success: true,
            data: list,
        });
    }
    catch (error) {
        console.error("Get list error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch list",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getList = getList;
// Create a new list
const createList = async (req, res) => {
    try {
        const userId = req.user.userId;
        const listData = { ...req.body, userId };
        // Prevent multiple default lists
        if (listData.isDefault) {
            await List_1.default.updateMany({ userId, isDefault: true }, { isDefault: false });
        }
        // Get the highest order value for the user
        if (listData.order === undefined) {
            const lastList = await List_1.default.findOne({ userId }).sort({ order: -1 });
            listData.order = lastList ? lastList.order + 1 : 0;
        }
        const list = await List_1.default.create(listData);
        res.status(201).json({
            success: true,
            data: list,
        });
    }
    catch (error) {
        console.error("Create list error:", error);
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
            error: "Failed to create list",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.createList = createList;
// Update a list
const updateList = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const updates = req.body;
        const list = await List_1.default.findOne({ _id: id, userId });
        if (!list) {
            res.status(404).json({ success: false, error: "List not found" });
            return;
        }
        // Handle default list change
        if (updates.isDefault && !list.isDefault) {
            await List_1.default.updateMany({ userId, isDefault: true }, { isDefault: false });
        }
        // Update list fields
        Object.keys(updates).forEach((key) => {
            list[key] = updates[key];
        });
        await list.save();
        res.status(200).json({
            success: true,
            data: list,
        });
    }
    catch (error) {
        console.error("Update list error:", error);
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
            error: "Failed to update list",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.updateList = updateList;
// Delete a list (and optionally move tasks)
const deleteList = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { moveTasksToListId } = req.query;
        const list = await List_1.default.findOne({ _id: id, userId });
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
            const targetList = await List_1.default.findOne({ _id: moveTasksToListId, userId });
            if (!targetList) {
                res
                    .status(404)
                    .json({ success: false, error: "Target list not found" });
                return;
            }
            await Task_1.default.updateMany({ listId: id, userId }, { listId: moveTasksToListId });
            await targetList.updateTaskCount();
        }
        else {
            // Move tasks to inbox (null listId)
            await Task_1.default.updateMany({ listId: id, userId }, { listId: null });
        }
        await list.deleteOne();
        res.status(200).json({
            success: true,
            message: "List deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete list error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete list",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.deleteList = deleteList;
// Archive/Unarchive a list
const archiveList = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { isArchived } = req.body;
        const list = await List_1.default.findOne({ _id: id, userId });
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
    }
    catch (error) {
        console.error("Archive list error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to archive list",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.archiveList = archiveList;
// Bulk update lists (e.g., for reordering)
const bulkUpdateLists = async (req, res) => {
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
            const list = await List_1.default.findOne({ _id: update.id, userId });
            if (list) {
                Object.keys(update.updates).forEach((key) => {
                    list[key] = update.updates[key];
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
    }
    catch (error) {
        console.error("Bulk update lists error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to bulk update lists",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.bulkUpdateLists = bulkUpdateLists;
// Refresh task count for a list
const refreshListTaskCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const list = await List_1.default.findOne({ _id: id, userId });
        if (!list) {
            res.status(404).json({ success: false, error: "List not found" });
            return;
        }
        await list.updateTaskCount();
        res.status(200).json({
            success: true,
            data: list,
        });
    }
    catch (error) {
        console.error("Refresh list task count error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to refresh task count",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.refreshListTaskCount = refreshListTaskCount;
