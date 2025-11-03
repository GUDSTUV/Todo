# Notification System Flow Diagram

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER STARTUP                           │
│  server.ts → initNotificationScheduler()                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CRON JOBS INITIALIZED                          │
│  scheduler/notifications.ts                                 │
└───┬─────────────────────┬──────────────────┬────────────────┘
    │                     │                  │
    │                     │                  │
    ▼                     ▼                  ▼
┌──────────┐      ┌──────────────┐   ┌─────────────┐
│ EVERY    │      │ DAILY        │   │ EVERY 6 HRS │
│ MINUTE   │      │ AT 8:00 AM   │   │ AT :00      │
│ * * * * *│      │ 0 8 * * *    │   │ 0 */6 * * * │
└─────┬────┘      └──────┬───────┘   └──────┬──────┘
      │                  │                   │
      ▼                  ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│processDue    │  │processTasks  │  │processOverdue│
│Reminders()   │  │DueToday()    │  │Tasks()       │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       │                 │                  │
       ▼                 ▼                  ▼
┌─────────────────────────────────────────────────┐
│         FIND MATCHING TASKS IN DATABASE         │
│                                                  │
│  • reminderDate within next minute              │
│  • dueDate = today, status != done              │
│  • dueDate < now, status != done                │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│          CHECK FOR DUPLICATES                   │
│                                                  │
│  Due Today: Skip if notified today              │
│  Overdue:   Skip if notified in last 24h        │
│  Reminders: No check (one-time)                 │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│        CREATE NOTIFICATIONS                     │
│                                                  │
│  Type: reminder / task_due / task_overdue       │
│  User: Task owner                               │
│  Message: Task title + type                     │
└───────────────────┬──────────────────────────────┘
                    │
                    ├────────────┬─────────────┐
                    ▼            ▼             ▼
            ┌───────────┐  ┌──────────┐  ┌──────────┐
            │ IN-APP    │  │ IN-APP   │  │ IN-APP   │
            │ + EMAIL   │  │   ONLY   │  │   ONLY   │
            │ (Reminder)│  │ (Due)    │  │(Overdue) │
            └───────────┘  └──────────┘  └──────────┘
```

## 🔄 Processing Flow

### 1. Reminder Processing (Every Minute)
```
┌─ CRON TRIGGER (Every Minute) ─┐
│                                │
├─ Find Tasks                    │
│  WHERE:                        │
│  • reminderDate <= now + 1 min │
│  • reminderDate >= now         │
│  • status != 'done'            │
│                                │
├─ For Each Task:                │
│  ├─ Create Notification        │
│  │  Type: 'reminder'           │
│  │  Title: 'Task Reminder'     │
│  │  Message: 'Reminder: [Task]'│
│  │                              │
│  └─ Send Email                 │
│     To: User's email           │
│     Subject: 'Task Reminder'   │
│     HTML: Task details + link  │
│                                │
└─ LOG: Processed X reminders    │
```

### 2. Due Today Processing (Daily 8:00 AM)
```
┌─ CRON TRIGGER (8:00 AM) ──────┐
│                                │
├─ Define Time Range             │
│  Start: Today 00:00:00         │
│  End:   Today 23:59:59         │
│                                │
├─ Find Tasks                    │
│  WHERE:                        │
│  • dueDate between start & end │
│  • status != 'done'            │
│                                │
├─ For Each Task:                │
│  ├─ Check Duplicates           │
│  │  IF notification exists     │
│  │  today → SKIP               │
│  │                              │
│  └─ Create Notification        │
│     Type: 'task_due'           │
│     Title: 'Task Due Today'    │
│     Message: '[Task] is due...'│
│                                │
└─ LOG: Processed X tasks        │
```

### 3. Overdue Processing (Every 6 Hours)
```
┌─ CRON TRIGGER (0,6,12,18:00) ─┐
│                                │
├─ Find Tasks                    │
│  WHERE:                        │
│  • dueDate < now               │
│  • status != 'done'            │
│                                │
├─ For Each Task:                │
│  ├─ Check Recent Notifications │
│  │  IF notified in last 24h    │
│  │  → SKIP (prevent spam)      │
│  │                              │
│  └─ Create Notification        │
│     Type: 'task_overdue'       │
│     Title: 'Task Overdue'      │
│     Message: '[Task] is over...'│
│                                │
└─ LOG: Processed X overdue      │
```

## 📧 Email Notification Flow (Reminders Only)

```
┌─────────────────────────────────────────┐
│     processDueReminders()               │
│     └─ sendTaskReminderEmail()          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Build Email Content:                   │
│                                          │
│  Subject: "Task Reminder - Todu"        │
│  To: user.email                         │
│  HTML:                                  │
│    • Task title                         │
│    • Description                        │
│    • Priority                           │
│    • Due date                           │
│    • Action button → View Task          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Send via SMTP                          │
│  (Gmail App Password)                   │
│                                          │
│  • Host: smtp.gmail.com                 │
│  • Port: 587                            │
│  • Secure: TLS                          │
└─────────────────────────────────────────┘
```

## 🎯 Notification Types & Timing

| Type | When | Frequency | Email | Duplicate Check |
|------|------|-----------|-------|-----------------|
| **Reminder** | User-defined time | Once | ✅ Yes | ❌ No (one-time) |
| **Due Today** | 8:00 AM if due today | Once/day | ❌ No | ✅ Yes (daily) |
| **Overdue** | Every 6h if past due | 4x/day | ❌ No | ✅ Yes (24h) |

## 💾 Database Schema

### Notification Document
```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Who receives it
  taskId: ObjectId,           // Related task
  type: 'reminder' | 'task_due' | 'task_overdue',
  title: string,              // "Task Reminder"
  message: string,            // "Reminder: Buy milk"
  read: boolean,              // Default: false
  actionUrl: string,          // "/dashboard?task=123"
  metadata: {
    taskTitle: string,
    priority: string,
    dueDate: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Task Document (Relevant Fields)
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  status: 'todo' | 'in-progress' | 'done',
  dueDate: Date,              // For due today & overdue
  reminderDate: Date,         // For reminders
  priority: 'low' | 'medium' | 'high'
}
```

## 🔍 Query Examples

### Find Tasks for Reminders
```javascript
Task.find({
  reminderDate: {
    $lte: new Date(now.getTime() + 60000),  // Next minute
    $gte: now
  },
  status: { $ne: 'done' }
})
```

### Find Tasks Due Today
```javascript
Task.find({
  dueDate: {
    $gte: today,      // Today 00:00:00
    $lt: tomorrow     // Tomorrow 00:00:00
  },
  status: { $ne: 'done' }
})
```

### Find Overdue Tasks
```javascript
Task.find({
  dueDate: { $lt: now },
  status: { $ne: 'done' }
})
```

## 📊 Monitoring Queries

### Check Recent Notifications
```javascript
// Due today notifications created today
Notification.findOne({
  userId: task.userId,
  taskId: task._id,
  type: 'task_due',
  createdAt: { $gte: today }
})

// Overdue notifications in last 24h
Notification.findOne({
  userId: task.userId,
  taskId: task._id,
  type: 'task_overdue',
  createdAt: { $gte: oneDayAgo }
})
```

## 🎬 Example Timeline

```
Day 1 - Monday
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
00:00 → Overdue check (Task A from last week)
        ✓ Notify: "Task A is overdue"

06:00 → Overdue check
        ✗ Skip: Task A notified < 24h ago

08:00 → Due today check (Task B due today)
        ✓ Notify: "Task B is due today"

10:30 → Reminder check (Task C reminder = 10:30)
        ✓ Notify: "Reminder: Task C"
        ✓ Email: Send reminder email

12:00 → Overdue check
        ✗ Skip: Task A notified < 24h ago

18:00 → Overdue check
        ✗ Skip: Task A notified < 24h ago

Day 2 - Tuesday
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
00:00 → Overdue check (Task A still overdue)
        ✓ Notify: "Task A is overdue" (24h passed)

08:00 → Due today check
        • No tasks due today
        • No notifications sent
```

## 🚦 Status Indicators

```
🟢 ACTIVE   - Scheduler running, cron jobs executing
🟡 CHECKING - Currently processing notifications
🔵 SENT     - Notification created successfully
⚪ SKIPPED  - Duplicate, not sent
🔴 ERROR    - Failed to process
```

## ✅ Verification Checklist

- [x] Server logs show: `[Scheduler] Notification cron jobs initialized`
- [x] Three cron jobs configured (reminders, due today, overdue)
- [x] All processor functions implemented
- [x] Duplicate prevention in place
- [x] Email integration configured
- [x] Test endpoint available
- [x] Database queries optimized with indexes
- [x] Error handling and logging
- [x] Production-ready (test endpoint disabled in prod)

**System Status: ✅ FULLY OPERATIONAL**
