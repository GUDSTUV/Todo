import Activity, { IActivity } from "../models/Activity";
import mongoose from "mongoose";

interface CreateActivityInput {
  userId: mongoose.Types.ObjectId | string;
  taskId?: mongoose.Types.ObjectId | string;
  listId?: mongoose.Types.ObjectId | string;
  type: IActivity["type"];
  description: string;
  metadata?: Record<string, any>;
  visibility?: "private" | "team";
}

/**
 * Log an activity
 */
export const logActivity = async (
  input: CreateActivityInput
): Promise<IActivity> => {
  try {
    const activity = await Activity.create(input);
    return activity;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

/**
 * Get activities for a user (their own + team activities from shared lists)
 */
export const getUserActivities = async (
  userId: string | mongoose.Types.ObjectId,
  options?: { limit?: number; skip?: number }
): Promise<IActivity[]> => {
  try {
    const activities = await Activity.find({
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

    return activities as unknown as IActivity[];
  } catch (error) {
    console.error("Error fetching user activities:", error);
    throw error;
  }
};

/**
 * Get activities for a specific list
 */
export const getListActivities = async (
  listId: string | mongoose.Types.ObjectId,
  options?: { limit?: number; skip?: number }
): Promise<IActivity[]> => {
  try {
    const activities = await Activity.find({ listId })
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .populate("userId", "name email avatarUrl")
      .populate("taskId", "title status")
      .lean()
      .exec();

    return activities as unknown as IActivity[];
  } catch (error) {
    console.error("Error fetching list activities:", error);
    throw error;
  }
};

/**
 * Get activities for a specific task
 */
export const getTaskActivities = async (
  taskId: string | mongoose.Types.ObjectId,
  options?: { limit?: number; skip?: number }
): Promise<IActivity[]> => {
  try {
    const activities = await Activity.find({ taskId })
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .populate("userId", "name email avatarUrl")
      .lean()
      .exec();

    return activities as unknown as IActivity[];
  } catch (error) {
    console.error("Error fetching task activities:", error);
    throw error;
  }
};
