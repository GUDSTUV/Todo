/**
 * Test script for notification system
 * Run with: npx ts-node src/test-notifications.ts
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Task from "./models/Task";
import {
  processDueReminders,
  processTasksDueToday,
  processOverdueTasks,
} from "./services/notificationService";

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/todu";

async function testNotificationSystem() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");

    // Check for tasks with reminders
    const tasksWithReminders = await Task.find({
      reminderDate: { $exists: true, $ne: null },
      status: { $ne: "done" },
    });
    console.log(
      `📅 Tasks with reminders: ${tasksWithReminders.length}`
    );
    if (tasksWithReminders.length > 0) {
      console.log("Sample tasks with reminders:");
      tasksWithReminders.slice(0, 3).forEach((task) => {
        console.log(
          `  - "${task.title}" (Reminder: ${task.reminderDate})`
        );
      });
      console.log();
    }

    // Check for tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.find({
      dueDate: { $gte: today, $lt: tomorrow },
      status: { $ne: "done" },
    });
    console.log(`📌 Tasks due today: ${tasksDueToday.length}`);
    if (tasksDueToday.length > 0) {
      console.log("Sample tasks due today:");
      tasksDueToday.slice(0, 3).forEach((task) => {
        console.log(
          `  - "${task.title}" (Due: ${task.dueDate})`
        );
      });
      console.log();
    }

    // Check for overdue tasks
    const now = new Date();
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: "done" },
    });
    console.log(`⚠️  Overdue tasks: ${overdueTasks.length}`);
    if (overdueTasks.length > 0) {
      console.log("Sample overdue tasks:");
      overdueTasks.slice(0, 3).forEach((task) => {
        console.log(
          `  - "${task.title}" (Due: ${task.dueDate})`
        );
      });
      console.log();
    }

    // Test the processors
    console.log("\n🔄 Testing notification processors...\n");

    console.log("1️⃣  Processing due reminders...");
    const remindersResult = await processDueReminders();
    console.log(
      `   ✓ Processed: ${remindersResult.processed}, Errors: ${remindersResult.errors}\n`
    );

    console.log("2️⃣  Processing tasks due today...");
    const dueTodayResult = await processTasksDueToday();
    console.log(
      `   ✓ Processed: ${dueTodayResult.processed}, Errors: ${dueTodayResult.errors}\n`
    );

    console.log("3️⃣  Processing overdue tasks...");
    const overdueResult = await processOverdueTasks();
    console.log(
      `   ✓ Processed: ${overdueResult.processed}, Errors: ${overdueResult.errors}\n`
    );

    console.log("\n✅ Notification system test completed!");
    console.log("\nSummary:");
    console.log(`- Reminders processed: ${remindersResult.processed}`);
    console.log(`- Due today processed: ${dueTodayResult.processed}`);
    console.log(`- Overdue processed: ${overdueResult.processed}`);
    console.log(
      `- Total notifications created: ${
        remindersResult.processed +
        dueTodayResult.processed +
        overdueResult.processed
      }`
    );
  } catch (error) {
    console.error("❌ Error testing notification system:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n✓ MongoDB connection closed");
  }
}

// Run the test
testNotificationSystem();
