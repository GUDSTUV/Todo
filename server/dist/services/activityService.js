"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskActivities = exports.getListActivities = exports.getUserActivities = exports.logActivity = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
/**
 * Log an activity
 */
const logActivity = async (input) => {
    try {
        const activity = await Activity_1.default.create(input);
        return activity;
    }
    catch (error) {
        console.error("Error logging activity:", error);
        throw error;
    }
};
exports.logActivity = logActivity;
/**
 * Get activities for a user (their own + team activities from shared lists)
 */
const getUserActivities = async (userId, options) => {
    try {
        const activities = await Activity_1.default.find({
            $or: [
                { userId }, // User's own activities
                { visibility: "team" }, // Team activities
            ],
        })
            .sort({ createdAt: -1 })
            .limit(options?.limit || 50)
            .skip(options?.skip || 0)
            .populate("userId", "name email avatarUrl")
            .populate("taskId", "title status")
            .populate("listId", "name")
            .lean()
            .exec();
        return activities;
    }
    catch (error) {
        console.error("Error fetching user activities:", error);
        throw error;
    }
};
exports.getUserActivities = getUserActivities;
/**
 * Get activities for a specific list
 */
const getListActivities = async (listId, options) => {
    try {
        const activities = await Activity_1.default.find({ listId })
            .sort({ createdAt: -1 })
            .limit(options?.limit || 50)
            .skip(options?.skip || 0)
            .populate("userId", "name email avatarUrl")
            .populate("taskId", "title status")
            .lean()
            .exec();
        return activities;
    }
    catch (error) {
        console.error("Error fetching list activities:", error);
        throw error;
    }
};
exports.getListActivities = getListActivities;
/**
 * Get activities for a specific task
 */
const getTaskActivities = async (taskId, options) => {
    try {
        const activities = await Activity_1.default.find({ taskId })
            .sort({ createdAt: -1 })
            .limit(options?.limit || 50)
            .skip(options?.skip || 0)
            .populate("userId", "name email avatarUrl")
            .lean()
            .exec();
        return activities;
    }
    catch (error) {
        console.error("Error fetching task activities:", error);
        throw error;
    }
};
exports.getTaskActivities = getTaskActivities;
