"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskActivitiesController = exports.getListActivitiesController = exports.getActivities = void 0;
const activityService_1 = require("../services/activityService");
// Get activities for current user
const getActivities = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit, skip } = req.query;
        const activities = await (0, activityService_1.getUserActivities)(userId, {
            limit: limit ? parseInt(limit) : 50,
            skip: skip ? parseInt(skip) : 0,
        });
        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities,
        });
    }
    catch (error) {
        console.error("Get activities error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch activities",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getActivities = getActivities;
// Get activities for a specific list
const getListActivitiesController = async (req, res) => {
    try {
        const { listId } = req.params;
        const { limit, skip } = req.query;
        const activities = await (0, activityService_1.getListActivities)(listId, {
            limit: limit ? parseInt(limit) : 50,
            skip: skip ? parseInt(skip) : 0,
        });
        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities,
        });
    }
    catch (error) {
        console.error("Get list activities error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch list activities",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getListActivitiesController = getListActivitiesController;
// Get activities for a specific task
const getTaskActivitiesController = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { limit, skip } = req.query;
        const activities = await (0, activityService_1.getTaskActivities)(taskId, {
            limit: limit ? parseInt(limit) : 50,
            skip: skip ? parseInt(skip) : 0,
        });
        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities,
        });
    }
    catch (error) {
        console.error("Get task activities error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch task activities",
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getTaskActivitiesController = getTaskActivitiesController;
