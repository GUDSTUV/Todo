import Notification, { INotification } from "../models/Notification";
import Task from "../models/Task";
import User from "../models/User";
import mongoose from "mongoose";
import { sendEmail } from "../utils/sendEmail";

interface CreateNotificationInput {
  userId: mongoose.Types.ObjectId | string;
  taskId?: mongoose.Types.ObjectId | string;
  type: INotification["type"];
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification
 */
export const createNotification = async (
  input: CreateNotificationInput
): Promise<INotification> => {
  try {
    const notification = await Notification.create(input);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (
  userId: string | mongoose.Types.ObjectId,
  options?: {
    read?: boolean;
    limit?: number;
    skip?: number;
  }
): Promise<INotification[]> => {
  try {
    const query: any = { userId };

    if (options?.read !== undefined) {
      query.read = options.read;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .lean()
      .exec();

    return notifications as unknown as INotification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (
  userId: string | mongoose.Types.ObjectId
): Promise<number> => {
  try {
    const count = await Notification.countDocuments({ userId, read: false });
    return count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw error;
  }
};

/**
 * Mark notification(s) as read
 */
export const markAsRead = async (
  notificationIds: string[] | mongoose.Types.ObjectId[],
  userId: string | mongoose.Types.ObjectId
): Promise<number> => {
  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId,
      },
      {
        $set: { read: true },
      }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (
  userId: string | mongoose.Types.ObjectId
): Promise<number> => {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete notification(s)
 */
export const deleteNotifications = async (
  notificationIds: string[] | mongoose.Types.ObjectId[],
  userId: string | mongoose.Types.ObjectId
): Promise<number> => {
  try {
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId,
    });

    return result.deletedCount;
  } catch (error) {
    console.error("Error deleting notifications:", error);
    throw error;
  }
};

/**
 * Create task reminder notification
 */
export const createTaskReminderNotification = async (
  taskId: string | mongoose.Types.ObjectId
): Promise<INotification | null> => {
  try {
    const task = await Task.findById(taskId).lean();
    if (!task) {
      console.error("Task not found for reminder:", taskId);
      return null;
    }

    const notification = await createNotification({
      userId: task.userId,
      taskId: task._id.toString(),
      type: "reminder",
      title: "Task Reminder",
      message: `Reminder: ${task.title}`,
      actionUrl: `/dashboard?task=${task._id}`,
      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating task reminder notification:", error);
    throw error;
  }
};

/**
 * Create task due notification
 */
export const createTaskDueNotification = async (
  taskId: string | mongoose.Types.ObjectId
): Promise<INotification | null> => {
  try {
    const task = await Task.findById(taskId).lean();
    if (!task) {
      console.error("Task not found for due notification:", taskId);
      return null;
    }

    const notification = await createNotification({
      userId: task.userId,
      taskId: task._id.toString(),
      type: "task_due",
      title: "Task Due Today",
      message: `"${task.title}" is due today`,
      actionUrl: `/dashboard?task=${task._id}`,
      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating task due notification:", error);
    throw error;
  }
};

/**
 * Create task overdue notification
 */
export const createTaskOverdueNotification = async (
  taskId: string | mongoose.Types.ObjectId
): Promise<INotification | null> => {
  try {
    const task = await Task.findById(taskId).lean();
    if (!task) {
      console.error("Task not found for overdue notification:", taskId);
      return null;
    }

    const notification = await createNotification({
      userId: task.userId,
      taskId: task._id.toString(),
      type: "task_overdue",
      title: "Task Overdue",
      message: `"${task.title}" is overdue`,
      actionUrl: `/dashboard?task=${task._id}`,
      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating task overdue notification:", error);
    throw error;
  }
};

/**
 * Send email notification for task reminder
 */
export const sendTaskReminderEmail = async (
  taskId: string | mongoose.Types.ObjectId
): Promise<void> => {
  try {
    const task = await Task.findById(taskId).lean();
    if (!task) {
      console.error("Task not found for email reminder:", taskId);
      return;
    }

    const user = await User.findById(task.userId).lean();
    if (!user) {
      console.error("User not found for email reminder:", task.userId);
      return;
    }

    const subject = "Task Reminder - Todu";
    const message = `Hi ${user.name}, this is a reminder for your task: ${task.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Task Reminder</h2>
        <p>Hi ${user.name},</p>
        <p>This is a reminder for your task:</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1F2937;">${task.title}</h3>
          ${task.description ? `<p style="color: #6B7280; margin: 5px 0;">${task.description}</p>` : ""}
          ${task.dueDate ? `<p style="color: #EF4444; margin: 5px 0;"><strong>Due:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ""}
          <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority}</span></p>
        </div>
        <p>
          <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard?task=${task._id}" 
             style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Task
          </a>
        </p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px;">
          You're receiving this email because you set a reminder for this task in Todu.
        </p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject,
      message,
      html,
    });
  } catch (error) {
    console.error("Error sending task reminder email:", error);
    // Don't throw - we don't want to fail the whole process if email fails
  }
};

/**
 * Check and process due reminders
 * This should be called by a cron job/scheduler
 */
export const processDueReminders = async (): Promise<{
  processed: number;
  errors: number;
}> => {
  try {
    const now = new Date();

    // Find tasks with reminders due within the next minute
    const tasks = await Task.find({
      reminderDate: {
        $lte: new Date(now.getTime() + 60000), // Next minute
        $gte: now,
      },
      status: { $ne: "done" },
    }).lean();

    let processed = 0;
    let errors = 0;

    for (const task of tasks) {
      try {
        // Create in-app notification
        await createTaskReminderNotification(task._id.toString());

        // Send email notification
        await sendTaskReminderEmail(task._id.toString());

        processed++;
      } catch (error) {
        console.error(`Error processing reminder for task ${task._id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  } catch (error) {
    console.error("Error in processDueReminders:", error);
    throw error;
  }
};

/**
 * Check and create notifications for tasks due today
 */
export const processTasksDueToday = async (): Promise<{
  processed: number;
  errors: number;
}> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find tasks due today that haven't been completed
    const tasks = await Task.find({
      dueDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: { $ne: "done" },
    }).lean();

    let processed = 0;
    let errors = 0;

    for (const task of tasks) {
      try {
        // Check if notification already exists for today
        const existingNotification = await Notification.findOne({
          userId: task.userId,
          taskId: task._id,
          type: "task_due",
          createdAt: { $gte: today },
        });

        if (!existingNotification) {
          await createTaskDueNotification(task._id.toString());
          processed++;
        }
      } catch (error) {
        console.error(`Error processing due task ${task._id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  } catch (error) {
    console.error("Error in processTasksDueToday:", error);
    throw error;
  }
};

/**
 * Check and create notifications for overdue tasks
 */
export const processOverdueTasks = async (): Promise<{
  processed: number;
  errors: number;
}> => {
  try {
    const now = new Date();

    // Find overdue tasks that haven't been completed
    const tasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: "done" },
    }).lean();

    let processed = 0;
    let errors = 0;

    for (const task of tasks) {
      try {
        // Check if overdue notification was created in the last 24 hours
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const existingNotification = await Notification.findOne({
          userId: task.userId,
          taskId: task._id,
          type: "task_overdue",
          createdAt: { $gte: oneDayAgo },
        });

        if (!existingNotification) {
          await createTaskOverdueNotification(task._id.toString());
          processed++;
        }
      } catch (error) {
        console.error(`Error processing overdue task ${task._id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  } catch (error) {
    console.error("Error in processOverdueTasks:", error);
    throw error;
  }
};
