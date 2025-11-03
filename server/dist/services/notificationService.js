"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOverdueTasks = exports.processTasksDueToday = exports.processDueReminders = exports.sendTaskReminderEmail = exports.createTaskOverdueNotification = exports.createTaskDueNotification = exports.createTaskReminderNotification = exports.deleteNotifications = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getUserNotifications = exports.createNotification = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const sendEmail_1 = require("../utils/sendEmail");
/**
 * Create a new notification
 */
const createNotification = async (input) => {
    try {
        const notification = await Notification_1.default.create(input);
        return notification;
    }
    catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};
exports.createNotification = createNotification;
/**
 * Get all notifications for a user
 */
const getUserNotifications = async (userId, options) => {
    try {
        const query = { userId };
        if (options?.read !== undefined) {
            query.read = options.read;
        }
        const notifications = await Notification_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(options?.limit || 50)
            .skip(options?.skip || 0)
            .lean()
            .exec();
        return notifications;
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
};
exports.getUserNotifications = getUserNotifications;
/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
    try {
        const count = await Notification_1.default.countDocuments({ userId, read: false });
        return count;
    }
    catch (error) {
        console.error("Error fetching unread count:", error);
        throw error;
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * Mark notification(s) as read
 */
const markAsRead = async (notificationIds, userId) => {
    try {
        const result = await Notification_1.default.updateMany({
            _id: { $in: notificationIds },
            userId,
        }, {
            $set: { read: true },
        });
        return result.modifiedCount;
    }
    catch (error) {
        console.error("Error marking notifications as read:", error);
        throw error;
    }
};
exports.markAsRead = markAsRead;
/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
    try {
        const result = await Notification_1.default.updateMany({ userId, read: false }, { $set: { read: true } });
        return result.modifiedCount;
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        throw error;
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * Delete notification(s)
 */
const deleteNotifications = async (notificationIds, userId) => {
    try {
        const result = await Notification_1.default.deleteMany({
            _id: { $in: notificationIds },
            userId,
        });
        return result.deletedCount;
    }
    catch (error) {
        console.error("Error deleting notifications:", error);
        throw error;
    }
};
exports.deleteNotifications = deleteNotifications;
/**
 * Create task reminder notification
 */
const createTaskReminderNotification = async (taskId) => {
    try {
        const task = await Task_1.default.findById(taskId).lean();
        if (!task) {
            console.error("Task not found for reminder:", taskId);
            return null;
        }
        const notification = await (0, exports.createNotification)({
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
    }
    catch (error) {
        console.error("Error creating task reminder notification:", error);
        throw error;
    }
};
exports.createTaskReminderNotification = createTaskReminderNotification;
/**
 * Create task due notification
 */
const createTaskDueNotification = async (taskId) => {
    try {
        const task = await Task_1.default.findById(taskId).lean();
        if (!task) {
            console.error("Task not found for due notification:", taskId);
            return null;
        }
        const notification = await (0, exports.createNotification)({
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
    }
    catch (error) {
        console.error("Error creating task due notification:", error);
        throw error;
    }
};
exports.createTaskDueNotification = createTaskDueNotification;
/**
 * Create task overdue notification
 */
const createTaskOverdueNotification = async (taskId) => {
    try {
        const task = await Task_1.default.findById(taskId).lean();
        if (!task) {
            console.error("Task not found for overdue notification:", taskId);
            return null;
        }
        const notification = await (0, exports.createNotification)({
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
    }
    catch (error) {
        console.error("Error creating task overdue notification:", error);
        throw error;
    }
};
exports.createTaskOverdueNotification = createTaskOverdueNotification;
/**
 * Send email notification for task reminder
 */
const sendTaskReminderEmail = async (taskId) => {
    try {
        const task = await Task_1.default.findById(taskId).lean();
        if (!task) {
            console.error("Task not found for email reminder:", taskId);
            return;
        }
        const user = await User_1.default.findById(task.userId).lean();
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
        await (0, sendEmail_1.sendEmail)({
            email: user.email,
            subject,
            message,
            html,
        });
    }
    catch (error) {
        console.error("Error sending task reminder email:", error);
        // Don't throw - we don't want to fail the whole process if email fails
    }
};
exports.sendTaskReminderEmail = sendTaskReminderEmail;
/**
 * Check and process due reminders
 * This should be called by a cron job/scheduler
 */
const processDueReminders = async () => {
    try {
        const now = new Date();
        // Find tasks with reminders due within the next minute
        const tasks = await Task_1.default.find({
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
                await (0, exports.createTaskReminderNotification)(task._id.toString());
                // Send email notification
                await (0, exports.sendTaskReminderEmail)(task._id.toString());
                processed++;
            }
            catch (error) {
                console.error(`Error processing reminder for task ${task._id}:`, error);
                errors++;
            }
        }
        return { processed, errors };
    }
    catch (error) {
        console.error("Error in processDueReminders:", error);
        throw error;
    }
};
exports.processDueReminders = processDueReminders;
/**
 * Check and create notifications for tasks due today
 */
const processTasksDueToday = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Find tasks due today that haven't been completed
        const tasks = await Task_1.default.find({
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
                const existingNotification = await Notification_1.default.findOne({
                    userId: task.userId,
                    taskId: task._id,
                    type: "task_due",
                    createdAt: { $gte: today },
                });
                if (!existingNotification) {
                    await (0, exports.createTaskDueNotification)(task._id.toString());
                    processed++;
                }
            }
            catch (error) {
                console.error(`Error processing due task ${task._id}:`, error);
                errors++;
            }
        }
        return { processed, errors };
    }
    catch (error) {
        console.error("Error in processTasksDueToday:", error);
        throw error;
    }
};
exports.processTasksDueToday = processTasksDueToday;
/**
 * Check and create notifications for overdue tasks
 */
const processOverdueTasks = async () => {
    try {
        const now = new Date();
        // Find overdue tasks that haven't been completed
        const tasks = await Task_1.default.find({
            dueDate: { $lt: now },
            status: { $ne: "done" },
        }).lean();
        let processed = 0;
        let errors = 0;
        for (const task of tasks) {
            try {
                // Check if overdue notification was created in the last 24 hours
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const existingNotification = await Notification_1.default.findOne({
                    userId: task.userId,
                    taskId: task._id,
                    type: "task_overdue",
                    createdAt: { $gte: oneDayAgo },
                });
                if (!existingNotification) {
                    await (0, exports.createTaskOverdueNotification)(task._id.toString());
                    processed++;
                }
            }
            catch (error) {
                console.error(`Error processing overdue task ${task._id}:`, error);
                errors++;
            }
        }
        return { processed, errors };
    }
    catch (error) {
        console.error("Error in processOverdueTasks:", error);
        throw error;
    }
};
exports.processOverdueTasks = processOverdueTasks;
