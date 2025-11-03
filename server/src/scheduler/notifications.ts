import cron from "node-cron";
import {
  processDueReminders,
  processTasksDueToday,
  processOverdueTasks,
} from "../services/notificationService";

/**
 * Initialize notification-related cron jobs.
 * Schedules:
 *  - Every minute: process task reminders due within the next minute
 *  - Daily at 08:00: create notifications for tasks due today
 *  - Every 6 hours: create notifications for overdue tasks (if not already created recently)
 *
 * Controlled via env var NOTIFICATIONS_SCHEDULER_ENABLED (default: true)
 */
export const initNotificationScheduler = () => {
  const enabled =
    (process.env.NOTIFICATIONS_SCHEDULER_ENABLED ?? "true").toLowerCase() !==
    "false";
  if (!enabled) {
    console.log(
      "[Scheduler] Notification scheduler is disabled via NOTIFICATIONS_SCHEDULER_ENABLED=false"
    );
    return;
  }

  // Every minute - process due reminders
  cron.schedule("* * * * *", async () => {
    try {
      await processDueReminders();
    } catch (err) {
      console.error("[Scheduler] Error running processDueReminders:", err);
    }
  });

  // Daily at 08:00 - process tasks due today
  cron.schedule("0 8 * * *", async () => {
    try {
      await processTasksDueToday();
    } catch (err) {
      console.error("[Scheduler] Error running processTasksDueToday:", err);
    }
  });

  // Every 6 hours on the hour - process overdue tasks
  cron.schedule("0 */6 * * *", async () => {
    try {
      await processOverdueTasks();
    } catch (err) {
      console.error("[Scheduler] Error running processOverdueTasks:", err);
    }
  });

  console.log("[Scheduler] Notification cron jobs initialized");
};
