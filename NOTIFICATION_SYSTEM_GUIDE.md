# Notification System - Complete Guide

## Overview

The Todu notification system automatically sends in-app notifications and emails for task reminders and due dates. It runs continuously in the background using cron jobs.

## 🔔 Notification Types

### 1. **Task Reminders** 
- **Type**: `reminder`
- **Schedule**: Checked every minute
- **Trigger**: When a task's `reminderDate` is reached
- **Notification**: "Reminder: [Task Title]"
- **Email**: Yes (includes task details, priority, and due date)

### 2. **Tasks Due Today**
- **Type**: `task_due`
- **Schedule**: Daily at 8:00 AM
- **Trigger**: Tasks with `dueDate` = today (not completed)
- **Notification**: "[Task Title] is due today"
- **Email**: No
- **Note**: Only sends one notification per task per day (prevents duplicates)

### 3. **Overdue Tasks**
- **Type**: `task_overdue`
- **Schedule**: Every 6 hours (00:00, 06:00, 12:00, 18:00)
- **Trigger**: Tasks with `dueDate` < now (not completed)
- **Notification**: "[Task Title] is overdue"
- **Email**: No
- **Note**: Only sends one notification per task every 24 hours (prevents spam)

## 📅 Cron Schedules

| Processor | Cron Pattern | Description | Frequency |
|-----------|--------------|-------------|-----------|
| Due Reminders | `* * * * *` | Every minute | 1440 times/day |
| Tasks Due Today | `0 8 * * *` | Daily at 8:00 AM | Once per day |
| Overdue Tasks | `0 */6 * * *` | Every 6 hours at :00 | 4 times per day |

## 🚀 How It Works

### Initialization
The scheduler is automatically initialized when the server starts:

```typescript
// server/src/server.ts
initNotificationScheduler();
```

### Processors

#### 1. processDueReminders()
```typescript
// Finds tasks with reminderDate within the next minute
// Creates in-app notification + sends email
// No duplicate check (reminders are one-time)
```

#### 2. processTasksDueToday()
```typescript
// Finds tasks due today (00:00 - 23:59)
// Checks for existing notification today (prevents duplicates)
// Creates in-app notification only
```

#### 3. processOverdueTasks()
```typescript
// Finds tasks past their due date
// Checks for notification in last 24 hours (prevents spam)
// Creates in-app notification only
```

## 🧪 Testing the System

### Method 1: Use the Test Endpoint (Development Only)

**Trigger all processors:**
```bash
POST http://localhost:5000/api/notifications/process
```

**Trigger specific processor:**
```bash
POST http://localhost:5000/api/notifications/process
Content-Type: application/json

{
  "kind": "reminders"  // or "due-today" or "overdue"
}
```

**Example with curl:**
```bash
# Get your auth token first
TOKEN="your-jwt-token-here"

# Test all processors
curl -X POST http://localhost:5000/api/notifications/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test specific processor
curl -X POST http://localhost:5000/api/notifications/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"due-today"}'
```

### Method 2: Run the Test Script

```bash
cd server
npx ts-node src/test-notifications.ts
```

This will:
- Connect to your MongoDB database
- Show how many tasks have reminders, are due today, and are overdue
- Run all three processors
- Display results

### Method 3: Create Test Tasks

#### Test Reminder Notification:
1. Create a task
2. Set `reminderDate` to 1-2 minutes from now
3. Wait for the reminder
4. Check notifications (should receive in-app + email)

#### Test Due Today Notification:
1. Create a task
2. Set `dueDate` to today
3. Manually trigger: `POST /api/notifications/process` with `{"kind":"due-today"}`
4. Check notifications (should receive in-app notification)

#### Test Overdue Notification:
1. Create a task
2. Set `dueDate` to yesterday or earlier
3. Manually trigger: `POST /api/notifications/process` with `{"kind":"overdue"}`
4. Check notifications (should receive in-app notification)

## 📊 Monitoring

### Server Logs
The scheduler logs important events:

```
[Scheduler] Notification cron jobs initialized
[processDueReminders] Found 2 tasks with reminders due
[Scheduler] Reminders processed=2, errors=0
[processTasksDueToday] Found 5 tasks due today
[Scheduler] Tasks due today processed=5, errors=0
```

### Check Current Status
```bash
# In the server, you'll see:
[Scheduler] Notification cron jobs initialized

# If disabled:
[Scheduler] Notification scheduler is disabled via NOTIFICATIONS_SCHEDULER_ENABLED=false
```

## ⚙️ Configuration

### Environment Variables

**Disable the scheduler** (useful for testing):
```env
NOTIFICATIONS_SCHEDULER_ENABLED=false
```

**Email settings** (required for reminder emails):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@todu.app
CLIENT_URL=http://localhost:5173
```

## 📧 Email Notifications

Currently, only **reminder notifications** send emails. The email includes:
- Task title and description
- Priority level
- Due date (if set)
- Link to view the task

### Email Requirements
1. Configure email settings in `.env`
2. For Gmail:
   - Enable 2FA
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Use app password as `EMAIL_PASSWORD`

## 🔍 Troubleshooting

### No notifications received?

1. **Check if scheduler is running:**
   - Look for `[Scheduler] Notification cron jobs initialized` in server logs

2. **Check task conditions:**
   - Task must not be completed (`status !== "done"`)
   - Reminder: `reminderDate` must be set
   - Due today: `dueDate` must be today
   - Overdue: `dueDate` must be in the past

3. **Check for duplicates:**
   - Due today: Only one notification per day
   - Overdue: Only one notification per 24 hours

4. **Manually trigger:**
   ```bash
   POST /api/notifications/process
   ```

5. **Check database:**
   ```javascript
   // In MongoDB
   db.notifications.find({ userId: ObjectId("your-user-id") })
   db.tasks.find({ userId: ObjectId("your-user-id") })
   ```

### Email not received?

1. Check `.env` email configuration
2. Check server logs for email errors
3. Check spam folder
4. Verify app password is correct (for Gmail)

## 🔐 Security

- The `/process` endpoint is **development-only** (blocked in production)
- All notification endpoints require authentication
- Users can only see their own notifications
- Task access is validated before creating notifications

## 📈 Performance

- **Reminders**: Checks every minute, but only processes tasks due within next minute
- **Due Today**: Runs once daily at 8 AM
- **Overdue**: Runs 4 times daily (every 6 hours)
- All queries use indexes on `reminderDate`, `dueDate`, `status`
- Duplicate prevention reduces unnecessary notifications

## 🎯 Best Practices

1. **Set reminders strategically**: Don't set too many reminders for the same time
2. **Use due dates**: Even without reminders, you'll get notified at 8 AM
3. **Complete tasks**: Mark tasks as done to stop receiving overdue notifications
4. **Check notifications regularly**: Unread notifications persist until marked as read
5. **Test in development**: Use the `/process` endpoint to test without waiting for cron

## 📝 Future Enhancements

Potential improvements:
- Email notifications for due today and overdue tasks
- Customizable notification times (per user)
- Notification preferences (enable/disable by type)
- Push notifications (browser/mobile)
- Snooze functionality for reminders
- Digest emails (daily/weekly summary)

## 📚 Related Files

- `server/src/scheduler/notifications.ts` - Cron job setup
- `server/src/services/notificationService.ts` - Processor implementations
- `server/src/controllers/notificationController.ts` - API endpoints
- `server/src/models/Notification.ts` - Notification schema
- `server/src/routes/notificationRoutes.ts` - API routes
- `server/src/test-notifications.ts` - Test script

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] Log shows: `[Scheduler] Notification cron jobs initialized`
- [ ] Can create tasks with reminders
- [ ] Can create tasks with due dates
- [ ] Test endpoint works (development)
- [ ] Email configuration is correct
- [ ] Notifications appear in UI
- [ ] Notifications marked as read
- [ ] Email received for reminders
