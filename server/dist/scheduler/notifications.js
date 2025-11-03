"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNotificationScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notificationService_1 = require("../services/notificationService");
/**
 * Initialize notification-related cron jobs.
 * Schedules:
 *  - Every minute: process task reminders due within the next minute
 *  - Daily at 08:00: create notifications for tasks due today
 *  - Every 6 hours: create notifications for overdue tasks (if not already created recently)
 *
 * Controlled via env var NOTIFICATIONS_SCHEDULER_ENABLED (default: true)
 */
const initNotificationScheduler = () => {
    const enabled = (process.env.NOTIFICATIONS_SCHEDULER_ENABLED ?? "true").toLowerCase() !==
        "false";
    if (!enabled) {
        console.log("[Scheduler] Notification scheduler is disabled via NOTIFICATIONS_SCHEDULER_ENABLED=false");
        return;
    }
    // Every minute - process due reminders
    node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const res = await (0, notificationService_1.processDueReminders)();
            if (res.processed > 0) {
                console.log(`[Scheduler] Reminders processed=${res.processed}, errors=${res.errors}`);
            }
        }
        catch (err) {
            console.error("[Scheduler] Error running processDueReminders:", err);
        }
    });
    // Daily at 08:00 - process tasks due today
    node_cron_1.default.schedule("0 8 * * *", async () => {
        try {
            const res = await (0, notificationService_1.processTasksDueToday)();
            if (res.processed > 0) {
                console.log(`[Scheduler] Tasks due today processed=${res.processed}, errors=${res.errors}`);
            }
        }
        catch (err) {
            console.error("[Scheduler] Error running processTasksDueToday:", err);
        }
    });
    // Every 6 hours on the hour - process overdue tasks
    node_cron_1.default.schedule("0 */6 * * *", async () => {
        try {
            const res = await (0, notificationService_1.processOverdueTasks)();
            if (res.processed > 0) {
                console.log(`[Scheduler] Overdue tasks processed=${res.processed}, errors=${res.errors}`);
            }
        }
        catch (err) {
            console.error("[Scheduler] Error running processOverdueTasks:", err);
        }
    });
    console.log("[Scheduler] Notification cron jobs initialized");
};
exports.initNotificationScheduler = initNotificationScheduler;
