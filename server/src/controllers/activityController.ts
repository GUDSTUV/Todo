import { Request, Response } from "express";
import {
  getUserActivities,
  getListActivities,
  getTaskActivities,
} from "../services/activityService";

// Get activities for current user
export const getActivities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { limit, skip } = req.query;

    const activities = await getUserActivities(userId, {
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error: any) {
    console.error("Get activities error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activities",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get activities for a specific list
export const getListActivitiesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { listId } = req.params;
    const { limit, skip } = req.query;

    const activities = await getListActivities(listId, {
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error: any) {
    console.error("Get list activities error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch list activities",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get activities for a specific task
export const getTaskActivitiesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { limit, skip } = req.query;

    const activities = await getTaskActivities(taskId, {
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error: any) {
    console.error("Get task activities error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch task activities",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
